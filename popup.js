const btnStart = document.getElementById('btnStart');
const btnStop = document.getElementById('btnStop');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const levelBar = document.getElementById('levelBar');
const rmsValue = document.getElementById('rmsValue');
const visualizerCanvas = document.getElementById('visualizerCanvas');
const logArea = document.getElementById('logArea');
const inputVoskUrl = document.getElementById('inputVoskUrl');
const inputSourceLang = document.getElementById('inputSourceLang');
const inputTargetLang = document.getElementById('inputTargetLang');
const btnTestVosk = document.getElementById('btnTestVosk');
const inputApiKey = document.getElementById('inputApiKey');
const inputApiBaseUrl = document.getElementById('inputApiBaseUrl');
const inputApiModel = document.getElementById('inputApiModel');
const inputAiCorrection = document.getElementById('inputAiCorrection');
const voskIndicator = document.getElementById('voskIndicator');

const canvasCtx = visualizerCanvas.getContext('2d');

function log(msg, type = '') {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  const div = document.createElement('div');
  div.className = `log-item ${type}`;
  div.innerHTML = `<span class="time">${time}</span>${msg}`;
  logArea.prepend(div);
  if (logArea.children.length > 30) logArea.removeChild(logArea.lastChild);
}

function setStatus(state, text) {
  statusDot.className = `status-dot ${state}`;
  statusText.textContent = text;
  btnStart.disabled = state === 'active' || state === 'partial';
  btnStop.disabled = !state;
}

function setVoskIndicator(state) {
  voskIndicator.className = `vosk-indicator ${state}`;
  const labels = { connected: '已连接', disconnected: '未连接', loading: '加载中...' };
  voskIndicator.textContent = labels[state] || '未连接';
}

function drawVisualization(rms) {
  const w = visualizerCanvas.width / 2;
  const h = visualizerCanvas.height / 2;
  canvasCtx.fillStyle = '#16213e';
  canvasCtx.fillRect(0, 0, w, h);
  const barCount = 28;
  const barWidth = (w - (barCount - 1) * 2) / barCount;
  for (let i = 0; i < barCount; i++) {
    const barH = Math.max(2, rms * h * 4 * (0.5 + Math.random() * 0.5));
    const x = i * (barWidth + 2);
    const y = h - barH;
    const gradient = canvasCtx.createLinearGradient(x, y, x, h);
    gradient.addColorStop(0, '#e94560');
    gradient.addColorStop(1, '#0f3460');
    canvasCtx.fillStyle = gradient;
    canvasCtx.fillRect(x, y, barWidth, barH);
  }
}

function updateLevel(rms) {
  const pct = Math.min(100, rms * 500);
  levelBar.style.width = `${pct}%`;
  rmsValue.textContent = rms.toFixed(4);
  drawVisualization(rms);
}

function loadSettings() {
  chrome.storage.local.get(['voskUrl', 'sourceLang', 'targetLang', 'apiKey', 'apiBaseUrl', 'apiModel', 'aiCorrection'], (res) => {
    if (res.voskUrl) inputVoskUrl.value = res.voskUrl;
    if (res.sourceLang) inputSourceLang.value = res.sourceLang;
    if (res.targetLang) inputTargetLang.value = res.targetLang;
    if (res.apiKey) inputApiKey.value = res.apiKey;
    if (res.apiBaseUrl) inputApiBaseUrl.value = res.apiBaseUrl;
    if (res.apiModel) inputApiModel.value = res.apiModel;
    if (res.aiCorrection) inputAiCorrection.checked = true;
  });
}

function saveSettings() {
  const voskUrl = inputVoskUrl.value.trim();
  const sourceLang = inputSourceLang.value;
  const targetLang = inputTargetLang.value;
  const apiKey = inputApiKey.value.trim();
  const apiBaseUrl = inputApiBaseUrl.value.trim();
  const apiModel = inputApiModel.value.trim();
  const aiCorrection = inputAiCorrection.checked;
  chrome.storage.local.set({ voskUrl, sourceLang, targetLang, apiKey, apiBaseUrl, apiModel, aiCorrection });
  return { voskUrl, sourceLang, targetLang, apiKey, apiBaseUrl, apiModel, aiCorrection };
}

[inputVoskUrl, inputApiKey, inputApiBaseUrl, inputApiModel].forEach((el) => {
  el.addEventListener('change', () => {
    saveSettings();
    log('设置已自动保存', 'success');
  });
});

inputAiCorrection.addEventListener('change', () => {
  saveSettings();
  log(inputAiCorrection.checked ? 'AI 纠正已开启' : 'AI 纠正已关闭', 'success');
});

inputSourceLang.addEventListener('change', () => {
  saveSettings();
  log('设置已自动保存', 'success');
  chrome.runtime.sendMessage({ type: 'SWITCH_LANG', lang: inputSourceLang.value }).catch(() => {});
});

inputTargetLang.addEventListener('change', () => {
  saveSettings();
  log('设置已自动保存', 'success');
});

btnTestVosk.addEventListener('click', async () => {
  const url = inputVoskUrl.value.trim();
  if (!url) { log('请填写 Vosk 地址', 'error'); return; }
  const lang = inputSourceLang.value;
  const wsUrl = `${url}?lang=${lang}`;
  log('测试连接 ' + wsUrl + ' ...', 'info');
  setVoskIndicator('loading');
  try {
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => {
      setVoskIndicator('connected');
      log('Vosk 连接成功!', 'success');
      ws.close();
    };
    ws.onerror = () => {
      setVoskIndicator('disconnected');
      log('Vosk 连接失败', 'error');
    };
    setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        setVoskIndicator('disconnected');
        log('Vosk 连接超时', 'error');
        ws.close();
      }
    }, 8000);
  } catch (e) {
    setVoskIndicator('disconnected');
    log('连接错误: ' + e.message, 'error');
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'AUDIO_LEVEL') updateLevel(msg.rms);
  if (msg.type === 'POPUP_CAPTURE_STATUS') {
    if (msg.active) {
      setStatus('active', '抓取+转写中...');
    } else {
      setStatus('', '已停止');
      updateLevel(0);
    }
  }
  if (msg.type === 'POPUP_CAPTURE_ERROR') {
    log('错误: ' + msg.message, 'error');
    setStatus('error', '失败');
  }
  if (msg.type === 'VOSK_PARTIAL') {
    if (msg.text) log('[部分] ' + msg.text, 'info');
  }
  if (msg.type === 'VOSK_FINAL') {
    if (msg.text) log('[确认] ' + msg.text, 'success');
  }
  if (msg.type === 'VOSK_STATUS') {
    setVoskIndicator(msg.connected ? 'connected' : 'disconnected');
    if (msg.connected) setStatus('active', 'Vosk 已连接');
  }
  if (msg.type === 'VOSK_ERROR') {
    log('Vosk: ' + msg.message, 'error');
    setVoskIndicator('disconnected');
  }
  if (msg.type === 'VOSK_CONFIG') {
    log('模型已加载: ' + (msg.config?.language_name || msg.config?.language), 'success');
    setVoskIndicator('connected');
  }
});

chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (res) => {
  if (res?.captureActive) setStatus('active', '抓取+转写中...');
});

btnStart.addEventListener('click', () => {
  const settings = saveSettings();
  log('开始抓取+实时转写 [' + settings.sourceLang + '→' + settings.targetLang + ']...', 'info');
  chrome.runtime.sendMessage({ type: 'START_CAPTURE' }, (res) => {
    if (res?.ok) {
      setStatus('active', '连接中...');
      log('TabCapture 已启动', 'success');
    } else {
      log('失败: ' + (res?.message || '未知'), 'error');
      setStatus('error', '失败');
    }
  });
});

btnStop.addEventListener('click', () => {
  log('停止...', 'info');
  chrome.runtime.sendMessage({ type: 'STOP_CAPTURE' }, (res) => {
    if (res?.ok) {
      setStatus('', '已停止');
      updateLevel(0);
      setVoskIndicator('disconnected');
      log('已停止', 'success');
    }
  });
});

function initCanvas() {
  const rect = visualizerCanvas.getBoundingClientRect();
  visualizerCanvas.width = rect.width * 2;
  visualizerCanvas.height = rect.height * 2;
  canvasCtx.scale(2, 2);
  drawVisualization(0);
}

initCanvas();
loadSettings();
log('Language Agent v0.6.0 已加载', 'info');
