let audioCtx = null;
let analyser = null;
let mediaStream = null;
let analyzeTimer = null;
let processor = null;
let voskWs = null;
let isCapturing = false;
let voskPaused = false;
let voskUrl = 'ws://localhost:2700';
let currentLang = 'en';

const TARGET_SAMPLE_RATE = 16000;
const BUFFER_SIZE = 1024;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'OFFSCREEN_START_CAPTURE') {
    voskUrl = msg.voskUrl || 'ws://localhost:2700';
    currentLang = msg.lang || 'en';
    startCapture(msg.streamId);
    sendResponse({ ok: true });
    return;
  }

  if (msg.type === 'OFFSCREEN_STOP_CAPTURE') {
    stopCapture();
    sendResponse({ ok: true });
    return;
  }

  if (msg.type === 'OFFSCREEN_SWITCH_LANG') {
    currentLang = msg.lang || 'en';
    voskUrl = msg.voskUrl || voskUrl;
    if (isCapturing && !voskPaused) {
      connectVosk();
    }
    sendResponse({ ok: true });
    return;
  }

  if (msg.type === 'OFFSCREEN_PAUSE_VOSK') {
    voskPaused = true;
    disconnectVosk();
    sendResponse({ ok: true });
    return;
  }

  if (msg.type === 'OFFSCREEN_RESUME_VOSK') {
    voskPaused = false;
    if (isCapturing) {
      connectVosk();
    }
    sendResponse({ ok: true });
    return;
  }
});

function disconnectVosk() {
  if (voskWs) {
    try { voskWs.close(); } catch (e) {}
    voskWs = null;
  }
}

async function connectVosk() {
  disconnectVosk();

  const wsUrl = `${voskUrl}?lang=${currentLang}`;

  try {
    voskWs = new WebSocket(wsUrl);

    voskWs.onopen = () => {
      chrome.runtime.sendMessage({ type: 'VOSK_STATUS', connected: true, lang: currentLang }).catch(() => {});
    };

    voskWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          chrome.runtime.sendMessage({ type: 'VOSK_ERROR', message: data.error }).catch(() => {});
          return;
        }
        if (data.config) {
          chrome.runtime.sendMessage({ type: 'VOSK_CONFIG', config: data.config }).catch(() => {});
          return;
        }
        if (data.partial !== undefined) {
          chrome.runtime.sendMessage({ type: 'VOSK_PARTIAL', text: data.partial, lang: currentLang }).catch(() => {});
        }
        if (data.text !== undefined) {
          chrome.runtime.sendMessage({
            type: 'VOSK_FINAL',
            text: data.text,
            lang: currentLang,
            words: data.result || null
          }).catch(() => {});
        }
      } catch (e) {}
    };

    voskWs.onclose = () => {
      voskWs = null;
      chrome.runtime.sendMessage({ type: 'VOSK_STATUS', connected: false }).catch(() => {});
      if (isCapturing && !voskPaused) {
        setTimeout(() => {
          if (isCapturing && !voskPaused) connectVosk();
        }, 2000);
      }
    };

    voskWs.onerror = () => {
      chrome.runtime.sendMessage({ type: 'VOSK_STATUS', connected: false }).catch(() => {});
      chrome.runtime.sendMessage({ type: 'VOSK_ERROR', message: `无法连接 ${wsUrl}` }).catch(() => {});
    };
  } catch (e) {
    chrome.runtime.sendMessage({ type: 'VOSK_ERROR', message: e.message }).catch(() => {});
  }
}

function downsampleAndConvert(inputBuffer, inputSampleRate) {
  const ratio = inputSampleRate / TARGET_SAMPLE_RATE;
  const outputLength = Math.round(inputBuffer.length / ratio);
  const output = new Int16Array(outputLength);
  for (let i = 0; i < outputLength; i++) {
    const srcIdx = Math.round(i * ratio);
    const sample = Math.max(-1, Math.min(1, inputBuffer[srcIdx]));
    output[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
  }
  return output.buffer;
}

async function startCapture(streamId) {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId
        }
      },
      video: false
    });

    audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(mediaStream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    processor = audioCtx.createScriptProcessor(BUFFER_SIZE, 1, 1);
    source.connect(processor);
    processor.connect(audioCtx.destination);

    processor.onaudioprocess = (e) => {
      if (!isCapturing || voskPaused) return;
      const pcmBuffer = downsampleAndConvert(e.inputBuffer.getChannelData(0), audioCtx.sampleRate);
      if (voskWs && voskWs.readyState === WebSocket.OPEN) {
        voskWs.send(pcmBuffer);
      }
    };

    const analyzeLoop = () => {
      if (!analyser) return;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const v = (dataArray[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      chrome.runtime.sendMessage({ type: 'AUDIO_LEVEL', rms }).catch(() => {});
      analyzeTimer = setTimeout(analyzeLoop, 100);
    };
    analyzeLoop();

    isCapturing = true;
    voskPaused = false;
    connectVosk();

    chrome.runtime.sendMessage({ type: 'TAB_CAPTURE_STARTED' }).catch(() => {});
  } catch (e) {
    chrome.runtime.sendMessage({ type: 'TAB_CAPTURE_ERROR', message: e.message }).catch(() => {});
  }
}

function stopCapture() {
  isCapturing = false;
  voskPaused = false;

  if (voskWs) {
    if (voskWs.readyState === WebSocket.OPEN) {
      try { voskWs.send('{"eof" : 1}'); } catch (e) {}
    }
    voskWs.close();
    voskWs = null;
  }

  if (processor) {
    processor.disconnect();
    processor = null;
  }

  if (analyzeTimer) {
    clearTimeout(analyzeTimer);
    analyzeTimer = null;
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop());
    mediaStream = null;
  }
  if (audioCtx) {
    audioCtx.close();
    audioCtx = null;
    analyser = null;
  }

  chrome.runtime.sendMessage({ type: 'VOSK_STATUS', connected: false }).catch(() => {});
  chrome.runtime.sendMessage({ type: 'TAB_CAPTURE_STOPPED' }).catch(() => {});
}
