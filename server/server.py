import json
import os
import time
import asyncio
import argparse
from urllib.parse import urlparse, parse_qs
import websockets
from vosk import Model, SetLogLevel

SetLogLevel(-1)

parser = argparse.ArgumentParser()
parser.add_argument('--host', default='0.0.0.0', help='Host')
parser.add_argument('--port', type=int, default=2700, help='Port')
parser.add_argument('--unload-timeout', type=int, default=600, help='Unload idle model after N seconds')
args = parser.parse_args()

LANG_MAP = {
    'en': 'vosk-model-small-en-us-0.15',
    'zh': 'vosk-model-small-cn-0.22',
    'fr': 'vosk-model-small-fr-0.22',
    'de': 'vosk-model-small-de-0.15',
    'es': 'vosk-model-small-es-0.42',
    'pt': 'vosk-model-small-pt-0.3',
    'ru': 'vosk-model-small-ru-0.22',
}

LANG_NAMES = {
    'en': 'English',
    'zh': '中文',
    'fr': 'Français',
    'de': 'Deutsch',
    'es': 'Español',
    'pt': 'Português',
    'ru': 'Русский',
}

SERVER_DIR = os.path.dirname(os.path.abspath(__file__))

models_cache = {}
models_last_used = {}


def scan_models():
    available = {}
    for lang_code, folder_name in LANG_MAP.items():
        model_path = os.path.join(SERVER_DIR, folder_name)
        if os.path.isdir(model_path) and os.path.isdir(os.path.join(model_path, 'am')):
            available[lang_code] = model_path
    for entry in os.listdir(SERVER_DIR):
        entry_path = os.path.join(SERVER_DIR, entry)
        if os.path.isdir(entry_path) and entry.startswith('vosk-model-') and entry not in LANG_MAP.values():
            parts = entry.split('-')
            if len(parts) >= 4:
                code = parts[3]
                if code not in available:
                    available[code] = entry_path
    return available


available_models = scan_models()
print(f"Available models: {json.dumps({k: os.path.basename(v) for k, v in available_models.items()})}")


def get_model(lang):
    if lang in models_cache:
        models_last_used[lang] = time.time()
        return models_cache[lang]

    if lang not in available_models:
        return None

    model_path = available_models[lang]
    print(f"Loading model for '{lang}' from {model_path}...")
    t0 = time.time()
    model = Model(model_path)
    elapsed = time.time() - t0
    print(f"Model '{lang}' loaded in {elapsed:.1f}s")

    models_cache[lang] = model
    models_last_used[lang] = time.time()
    return model


def unload_idle_models():
    now = time.time()
    to_unload = []
    for lang, last_used in models_last_used.items():
        if now - last_used > args.unload_timeout:
            to_unload.append(lang)
    for lang in to_unload:
        print(f"Unloading idle model: {lang}")
        del models_cache[lang]
        del models_last_used[lang]


async def model_cleanup_loop():
    while True:
        await asyncio.sleep(60)
        unload_idle_models()


def parse_lang_from_path(path):
    parsed = urlparse(path)
    params = parse_qs(parsed.query)
    lang_list = params.get('lang', ['en'])
    return lang_list[0]


async def recognize(websocket):
    lang = parse_lang_from_path(websocket.request.path)
    model = get_model(lang)

    if model is None:
        await websocket.send(json.dumps({
            'error': f'No model available for language: {lang}',
            'available': list(available_models.keys())
        }))
        await websocket.close()
        return

    from vosk import KaldiRecognizer
    rec = KaldiRecognizer(model, 16000)
    rec.SetWords(True)
    rec.SetPartialWords(True)

    print(f"Client connected: lang={lang}, addr={websocket.remote_address}")
    await websocket.send(json.dumps({
        'config': {'language': lang, 'language_name': LANG_NAMES.get(lang, lang)}
    }))

    try:
        async for message in websocket:
            if isinstance(message, str):
                if message == '{"eof" : 1}':
                    result = rec.FinalResult()
                    await websocket.send(result)
                    break
                continue

            models_last_used[lang] = time.time()

            if rec.AcceptWaveform(message):
                result = rec.Result()
                await websocket.send(result)
            else:
                partial = rec.PartialResult()
                await websocket.send(partial)
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        print(f"Client disconnected: lang={lang}")


async def main():
    print(f"Vosk multi-language server starting on ws://{args.host}:{args.port}")
    print(f"Idle model unload timeout: {args.unload_timeout}s")

    async with websockets.serve(
        recognize,
        args.host,
        args.port,
        max_size=None
    ):
        asyncio.create_task(model_cleanup_loop())
        await asyncio.Future()


if __name__ == '__main__':
    asyncio.run(main())
