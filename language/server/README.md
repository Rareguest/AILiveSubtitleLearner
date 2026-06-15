# Vosk 本地语音识别服务器

## 安装

```bash
pip install -r requirements.txt
```

## 下载模型

从 https://alphacephei.com/vosk/models 下载模型，解压到 `server/` 目录下。

当前已包含的模型：
- `vosk-model-small-en-us-0.15` — English
- `vosk-model-small-cn-0.22` — 中文
- `vosk-model-small-fr-0.22` — Français
- `vosk-model-small-de-0.15` — Deutsch
- `vosk-model-small-es-0.42` — Español
- `vosk-model-small-pt-0.3` — Português
- `vosk-model-small-ru-0.22` — Русский

## 启动

```bash
python server.py
# 默认端口 2700

python server.py --port 2700 --unload-timeout 600
```

## 多语言连接

连接时通过 URL 参数指定语言：
```
ws://localhost:2700?lang=en   # 英文
ws://localhost:2700?lang=zh   # 中文
ws://localhost:2700?lang=fr   # 法文
ws://localhost:2700?lang=de   # 德文
ws://localhost:2700?lang=es   # 西班牙文
ws://localhost:2700?lang=pt   # 葡萄牙文
ws://localhost:2700?lang=ru   # 俄文
```

## HTTP API

- `GET /api/languages` — 返回可用语言列表
- `GET /api/status` — 返回已加载和可用的模型

## 协议

- 输入: 16kHz 16bit 单声道 PCM 音频流
- 输出 JSON:
  - `{ "config": { "language": "en", "language_name": "English" } }` — 连接确认
  - `{ "partial": "正在识别的文字..." }` — 实时部分结果
  - `{ "text": "最终确认的文字" }` — 完整识别结果
  - `{ "error": "错误信息", "available": [...] }` — 错误（如语言不可用）

## 模型管理

- 首次连接某语言时加载模型（约2-3秒），之后缓存
- 空闲超过 `--unload-timeout` 秒（默认600秒）自动卸载释放内存
