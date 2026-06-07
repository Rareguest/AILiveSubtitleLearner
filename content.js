(() => {
  if (window.__languageAgentPanelCreated) return;
  window.__languageAgentPanelCreated = true;

  let panel = null;
  let subtitleList = null;
  let partialItem = null;
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };

  let videoEl = null;
  let lastFinalVideoTime = null;
  let captureStartVideoTime = null;
  let isReplaying = false;
  let isReplayPaused = false;
  let replayTimeout = null;
  let replayGroup = null;
  let preReplayTime = null;
  let preReplayWasPlaying = false;
  let timeUpdateInterval = null;
  let userScrolling = false;
  let scrollTimeout = null;
  let translationVisible = false;
  let voskLiveActive = true;
  let firstSentence = true;

  const REPLAY_PRE_OVERLAP = 1.0;
  const REPLAY_POST_OVERLAP = 1.0;
  const STT_LATENCY = 0.8;

  function getVideoTime() {
    findVideo();
    return videoEl ? videoEl.currentTime : 0;
  }

  function findVideo() {
    if (videoEl && document.contains(videoEl)) return videoEl;
    videoEl = document.querySelector('video');
    return videoEl;
  }

  function isNearBottom() {
    const body = document.getElementById('la-body');
    if (!body) return true;
    return body.scrollHeight - body.scrollTop - body.clientHeight < 60;
  }

  function scrollToBottom() {
    if (userScrolling) return;
    const body = document.getElementById('la-body');
    if (body) body.scrollTop = body.scrollHeight;
  }

  function setupScrollDetection() {
    const body = document.getElementById('la-body');
    if (!body) return;
    body.addEventListener('scroll', () => {
      if (isNearBottom()) {
        userScrolling = false;
        return;
      }
      userScrolling = true;
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        userScrolling = false;
      }, 5000);
    });
  }

  function createPanel() {
    panel = document.createElement('div');
    panel.id = 'language-agent-panel';
    panel.innerHTML = `
      <div id="la-header">
        <span id="la-title">Language Agent</span>
        <div id="la-controls">
          <button id="la-trans-btn" title="显示/隐藏翻译">译</button>
          <button id="la-live-btn" title="回到最新进度" style="display:none;">▶▶ 直播</button>
          <button id="la-scroll-btn" title="回到底部">↓</button>
          <button id="la-minimize-btn" title="最小化">─</button>
          <button id="la-close-btn" title="关闭">✕</button>
        </div>
      </div>
      <div id="la-body">
        <div id="la-subtitle-list"></div>
      </div>
      <div id="la-footer">
        <span id="la-status-dot"></span>
        <span id="la-status-text">等待中...</span>
        <span id="la-lang-badge"></span>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      #language-agent-panel {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        width: 720px;
        max-height: 420px;
        background: rgba(10, 10, 22, 0.96);
        border: 1px solid rgba(233, 69, 96, 0.25);
        border-radius: 16px;
        box-shadow: 0 12px 48px rgba(0,0,0,0.6);
        z-index: 2147483647;
        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        color: #e0e0e0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        backdrop-filter: blur(16px);
        transition: max-height 0.3s ease, width 0.3s ease;
      }
      #language-agent-panel.minimized {
        max-height: 44px;
        width: 220px;
        transform: translateX(-50%);
      }
      #language-agent-panel.minimized #la-body,
      #language-agent-panel.minimized #la-footer { display: none; }
      #la-header {
        display: flex; justify-content: space-between; align-items: center;
        padding: 10px 18px; background: rgba(22, 33, 62, 0.9);
        cursor: move; user-select: none; flex-shrink: 0;
      }
      #la-title { font-size: 13px; font-weight: 700; color: #e94560; letter-spacing: 0.5px; }
      #la-controls { display: flex; gap: 4px; }
      #la-controls button {
        background: none; border: none; color: #888; cursor: pointer;
        font-size: 14px; padding: 2px 8px; border-radius: 4px; transition: all 0.2s;
      }
      #la-controls button:hover { color: #e0e0e0; background: rgba(255,255,255,0.1); }
      #la-trans-btn.off { color: #555; }
      #la-trans-btn.on { color: #64b5f6; background: rgba(100,181,246,0.15); }
      #la-live-btn {
        color: #e94560; font-size: 11px; font-weight: 700; letter-spacing: 0.5px;
        background: rgba(233,69,96,0.12); border-radius: 4px; padding: 2px 8px;
      }
      #la-live-btn:hover { background: rgba(233,69,96,0.25); }
      #la-body { flex: 1; overflow-y: auto; padding: 12px 18px; min-height: 160px; }
      #la-subtitle-list { display: flex; flex-direction: column; gap: 8px; }

      .la-item-group {
        padding: 10px 14px;
        background: rgba(255,255,255,0.04);
        border-radius: 10px;
        border-left: 4px solid #4caf50;
        animation: la-fadein 0.15s ease;
        transition: background 0.15s, border-left-color 0.15s;
        position: relative;
      }
      .la-item-group.partial-group {
        border-left-color: #ff9800;
      }
      .la-item-group.replaying {
        background: rgba(233, 69, 96, 0.12);
        border-left-color: #e94560;
        box-shadow: 0 0 0 1px rgba(233, 69, 96, 0.2);
      }

      .la-source-text {
        font-size: 20px; line-height: 1.5; word-break: break-word;
        color: #f0f0f0; font-weight: 500;
      }
      .la-source-text.partial {
        color: #999; font-weight: 400; font-size: 18px;
      }
      .la-source-text.partial .la-cursor {
        display: inline-block; width: 2px; height: 18px;
        background: #ff9800; margin-left: 3px; vertical-align: middle;
        animation: la-blink 0.8s infinite;
      }
      .la-translation-text {
        font-size: 16px; line-height: 1.4; word-break: break-word;
        color: #64b5f6; margin-top: 5px; padding-top: 5px;
        border-top: 1px dashed rgba(100, 181, 246, 0.2);
      }
      .la-translation-text.placeholder {
        color: #3a3a3a; font-style: italic; font-size: 14px;
      }
      .la-translation-text.hidden {
        display: none;
      }
      .la-translation-text.streaming .la-trans-cursor {
        display: inline-block; width: 2px; height: 14px;
        background: #64b5f6; margin-left: 2px; vertical-align: middle;
        animation: la-blink 0.6s infinite;
      }
      .la-item-meta {
        display: flex; align-items: center; gap: 8px;
        margin-top: 8px;
      }
      .la-lang-label { font-size: 10px; color: #555; }
      .la-replay-btn {
        display: inline-flex; align-items: center; justify-content: center;
        gap: 5px; min-width: 72px; padding: 4px 14px;
        font-size: 12px; font-weight: 600; color: #ccc;
        background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
        border-radius: 16px; cursor: pointer; transition: all 0.2s;
        user-select: none;
      }
      .la-replay-btn:hover {
        background: rgba(233, 69, 96, 0.15);
        border-color: rgba(233, 69, 96, 0.4);
        color: #e94560;
      }
      .la-replay-btn.playing {
        background: rgba(233, 69, 96, 0.2);
        border-color: rgba(233, 69, 96, 0.5);
        color: #e94560;
      }
      .la-replay-btn.paused {
        background: rgba(255, 152, 0, 0.15);
        border-color: rgba(255, 152, 0, 0.4);
        color: #ff9800;
      }
      .la-time-label { font-size: 10px; color: #444; margin-left: auto; }

      @keyframes la-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      @keyframes la-fadein {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: translateY(0); }
      }

      #la-footer {
        display: flex; align-items: center; gap: 8px;
        padding: 8px 18px; background: rgba(22, 33, 62, 0.6); flex-shrink: 0;
      }
      .la-status-dot {
        width: 7px; height: 7px; border-radius: 50%;
        background: #555; flex-shrink: 0;
      }
      .la-status-dot.active { background: #4caf50; animation: la-pulse 1s infinite; }
      .la-status-dot.partial { background: #ff9800; animation: la-pulse 1s infinite; }
      .la-status-dot.replaying { background: #e94560; animation: la-pulse 0.6s infinite; }
      @keyframes la-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      #la-status-text { font-size: 11px; color: #888; flex: 1; }
      #la-lang-badge {
        font-size: 10px; padding: 2px 10px; border-radius: 10px;
        background: rgba(233, 69, 96, 0.15); color: #e94560;
      }

      #la-body::-webkit-scrollbar { width: 5px; }
      #la-body::-webkit-scrollbar-track { background: transparent; }
      #la-body::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
    `;

    document.documentElement.appendChild(style);
    document.documentElement.appendChild(panel);
    subtitleList = document.getElementById('la-subtitle-list');

    setupDrag();
    setupControls();
    setupScrollDetection();
    startTimeTracking();
  }

  function setupDrag() {
    const header = document.getElementById('la-header');
    header.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      isDragging = true;
      const rect = panel.getBoundingClientRect();
      dragOffset.x = e.clientX - rect.left;
      dragOffset.y = e.clientY - rect.top;
      panel.style.transition = 'none';
    });
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      panel.style.left = `${e.clientX - dragOffset.x}px`;
      panel.style.top = `${e.clientY - dragOffset.y}px`;
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
      panel.style.transform = 'none';
    });
    document.addEventListener('mouseup', () => {
      isDragging = false;
      panel.style.transition = '';
    });
  }

  function setupControls() {
    document.getElementById('la-minimize-btn').addEventListener('click', () => {
      panel.classList.toggle('minimized');
    });
    document.getElementById('la-close-btn').addEventListener('click', () => {
      panel.style.display = 'none';
    });
    document.getElementById('la-scroll-btn').addEventListener('click', () => {
      userScrolling = false;
      scrollToBottom();
    });
    const transBtn = document.getElementById('la-trans-btn');
    transBtn.classList.add('off');
    transBtn.addEventListener('click', () => {
      translationVisible = !translationVisible;
      transBtn.className = translationVisible ? 'on' : 'off';
      document.querySelectorAll('.la-translation-text').forEach((el) => {
        el.classList.toggle('hidden', !translationVisible);
      });
    });
    document.getElementById('la-live-btn').addEventListener('click', () => {
      returnToLive();
    });
  }

  function startTimeTracking() {
    if (timeUpdateInterval) clearInterval(timeUpdateInterval);
    timeUpdateInterval = setInterval(() => { findVideo(); }, 2000);
    findVideo();
  }

  function updatePartial(text) {
    if (!subtitleList) return;
    if (!partialItem) {
      partialItem = document.createElement('div');
      partialItem.className = 'la-item-group partial-group';
      partialItem.innerHTML = '<div class="la-source-text partial"></div>';
      subtitleList.appendChild(partialItem);
    }
    partialItem.querySelector('.la-source-text').innerHTML = text + '<span class="la-cursor"></span>';
    scrollToBottom();
  }

  function addFinal(text, lang) {
    if (!subtitleList) return;

    const now = getVideoTime();
    const endTime = Math.max(0, now - STT_LATENCY);
    let startTime;
    if (firstSentence) {
      startTime = Math.max(0, captureStartVideoTime != null ? captureStartVideoTime : endTime - 3);
      firstSentence = false;
    } else if (lastFinalVideoTime != null) {
      startTime = lastFinalVideoTime;
    } else {
      startTime = Math.max(0, endTime - 3);
    }

    if (startTime >= endTime) {
      startTime = Math.max(0, endTime - 1.5);
    }

    if (partialItem) {
      partialItem.remove();
      partialItem = null;
    }
    lastFinalVideoTime = endTime;

    const group = document.createElement('div');
    group.className = 'la-item-group';
    group.dataset.startTime = startTime.toFixed(2);
    group.dataset.endTime = endTime.toFixed(2);

    const sourceDiv = document.createElement('div');
    sourceDiv.className = 'la-source-text';
    sourceDiv.textContent = text;

    const transDiv = document.createElement('div');
    transDiv.className = 'la-translation-text placeholder' + (translationVisible ? '' : ' hidden');
    transDiv.textContent = '翻译加载中...';

    const metaDiv = document.createElement('div');
    metaDiv.className = 'la-item-meta';

    const langLabel = document.createElement('span');
    langLabel.className = 'la-lang-label';
    langLabel.textContent = lang ? lang.toUpperCase() : '';

    const replayBtn = document.createElement('button');
    replayBtn.className = 'la-replay-btn';
    replayBtn.innerHTML = '&#9654; 回放';
    replayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleReplayClick(group, replayBtn);
    });

    const timeLabel = document.createElement('span');
    timeLabel.className = 'la-time-label';
    timeLabel.textContent = formatTime(startTime);

    metaDiv.appendChild(langLabel);
    metaDiv.appendChild(replayBtn);
    metaDiv.appendChild(timeLabel);

    group.appendChild(sourceDiv);
    group.appendChild(transDiv);
    group.appendChild(metaDiv);

    subtitleList.appendChild(group);
    scrollToBottom();

    while (subtitleList.children.length > 60) {
      subtitleList.removeChild(subtitleList.firstChild);
    }

    chrome.runtime.sendMessage({ type: 'REQUEST_TRANSLATION', text, lang });
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function handleReplayClick(group, btn) {
    findVideo();
    if (!videoEl) return;

    if (!isReplaying) {
      startReplay(group, btn);
    } else if (isReplaying && !isReplayPaused) {
      pauseReplay(btn);
    } else if (isReplaying && isReplayPaused) {
      resumeReplay(btn);
    }
  }

  async function startReplay(group, btn) {
    const rawStart = parseFloat(group.dataset.startTime);
    const rawEnd = parseFloat(group.dataset.endTime);
    if (isNaN(rawStart) || isNaN(rawEnd)) return;

    const startTime = Math.max(0, rawStart - REPLAY_PRE_OVERLAP);
    const endTime = rawEnd + REPLAY_POST_OVERLAP;

    findVideo();

    if (!isReplaying) {
      preReplayTime = videoEl ? videoEl.currentTime : 0;
      preReplayWasPlaying = videoEl ? !videoEl.paused : true;
    }

    isReplaying = true;
    isReplayPaused = false;
    replayGroup = group;
    voskLiveActive = false;

    document.getElementById('la-live-btn').style.display = '';

    chrome.runtime.sendMessage({ type: 'PAUSE_VOSK' });

    if (partialItem) {
      partialItem.remove();
      partialItem = null;
    }
    currentPartialStartVideoTime = null;

    document.querySelectorAll('.la-item-group.replaying').forEach((el) => {
      el.classList.remove('replaying');
    });
    document.querySelectorAll('.la-replay-btn.playing, .la-replay-btn.paused').forEach((el) => {
      el.className = 'la-replay-btn';
      el.innerHTML = '&#9654; 回放';
    });

    group.classList.add('replaying');
    btn.className = 'la-replay-btn playing';
    btn.innerHTML = '&#10074;&#10074; 暂停';

    videoEl.pause();
    videoEl.currentTime = startTime;
    await new Promise((r) => { videoEl.addEventListener('seeked', r, { once: true }); });
    videoEl.play();

    setStatus('replaying', '回放中...');

    const checkEnd = () => {
      if (!isReplaying || isReplayPaused) return;
      if (videoEl.currentTime >= endTime) {
        stopReplay();
        return;
      }
      requestAnimationFrame(checkEnd);
    };
    requestAnimationFrame(checkEnd);

    replayTimeout = setTimeout(() => { stopReplay(); }, (endTime - startTime + 0.5) * 1000);
  }

  function pauseReplay(btn) {
    isReplayPaused = true;
    if (videoEl) videoEl.pause();
    if (replayTimeout) { clearTimeout(replayTimeout); replayTimeout = null; }

    btn.className = 'la-replay-btn paused';
    btn.innerHTML = '&#9654; 继续';
    setStatus('active', '回放暂停');
  }

  function resumeReplay(btn) {
    isReplayPaused = false;
    if (videoEl) videoEl.play();

    btn.className = 'la-replay-btn playing';
    btn.innerHTML = '&#10074;&#10074; 暂停';
    setStatus('replaying', '回放中...');

    const endTime = parseFloat(replayGroup.dataset.endTime);
    const checkEnd = () => {
      if (!isReplaying || isReplayPaused) return;
      if (videoEl.currentTime >= endTime) {
        stopReplay();
        return;
      }
      requestAnimationFrame(checkEnd);
    };
    requestAnimationFrame(checkEnd);

    const remaining = (endTime - videoEl.currentTime + 0.5) * 1000;
    if (remaining > 0) {
      replayTimeout = setTimeout(() => { stopReplay(); }, remaining);
    }
  }

  function stopReplay() {
    isReplaying = false;
    isReplayPaused = false;
    replayGroup = null;
    voskLiveActive = false;
    if (replayTimeout) { clearTimeout(replayTimeout); replayTimeout = null; }
    if (videoEl) videoEl.pause();

    document.querySelectorAll('.la-item-group.replaying').forEach((el) => {
      el.classList.remove('replaying');
    });
    document.querySelectorAll('.la-replay-btn.playing, .la-replay-btn.paused').forEach((el) => {
      el.className = 'la-replay-btn';
      el.innerHTML = '&#9654; 回放';
    });

    setStatus('active', '回放结束 - 点击 ▶▶ 直播 继续');
  }

  async function returnToLive() {
    findVideo();
    if (!videoEl) return;

    isReplaying = false;
    isReplayPaused = false;
    replayGroup = null;
    voskLiveActive = true;
    if (replayTimeout) { clearTimeout(replayTimeout); replayTimeout = null; }

    document.querySelectorAll('.la-item-group.replaying').forEach((el) => {
      el.classList.remove('replaying');
    });
    document.querySelectorAll('.la-replay-btn.playing, .la-replay-btn.paused').forEach((el) => {
      el.className = 'la-replay-btn';
      el.innerHTML = '&#9654; 回放';
    });

    document.getElementById('la-live-btn').style.display = 'none';

    const targetTime = preReplayTime != null ? preReplayTime : videoEl.currentTime;
    videoEl.currentTime = targetTime;
    await new Promise((r) => { videoEl.addEventListener('seeked', r, { once: true }); });

    if (preReplayWasPlaying) {
      videoEl.play();
    }

    preReplayTime = null;

    chrome.runtime.sendMessage({ type: 'RESUME_VOSK' });

    setStatus('active', '监听中');
    captureStartVideoTime = getVideoTime();
    firstSentence = true;
    lastFinalVideoTime = null;
  }

  function setLangBadge(lang) {
    const badge = document.getElementById('la-lang-badge');
    if (badge) badge.textContent = lang ? lang.toUpperCase() : '';
  }

  function setStatus(state, text) {
    const dot = document.getElementById('la-status-dot');
    const statusText = document.getElementById('la-status-text');
    if (dot) dot.className = state ? `la-status-dot ${state}` : 'la-status-dot';
    if (statusText) statusText.textContent = text;
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'VOSK_PARTIAL') {
      if (!voskLiveActive) return;
      if (!panel) createPanel();
      if (panel.style.display === 'none') panel.style.display = '';
      if (msg.text) {
        updatePartial(msg.text);
        setStatus('partial', '识别中...');
        setLangBadge(msg.lang);
      }
    }

    if (msg.type === 'VOSK_FINAL') {
      if (!voskLiveActive) return;
      if (!panel) createPanel();
      if (msg.text) {
        addFinal(msg.text, msg.lang);
        setStatus('active', '监听中');
        setLangBadge(msg.lang);
      }
    }

    if (msg.type === 'VOSK_CONFIG') {
      setLangBadge(msg.config?.language);
    }

    if (msg.type === 'TEXT_CORRECTED') {
      if (!subtitleList) return;
      const items = subtitleList.querySelectorAll('.la-source-text:not(.partial)');
      for (const item of items) {
        if (item.textContent === msg.original) {
          item.textContent = msg.corrected;
          item.title = `原文: ${msg.original}`;
          item.style.textDecoration = 'underline';
          item.style.textDecorationStyle = 'dotted';
          item.style.textUnderlineOffset = '3px';
          item.style.textDecorationColor = 'rgba(233,69,96,0.4)';
          break;
        }
      }
    }

    if (msg.type === 'SHOW_PANEL') {
      if (!panel) createPanel();
      panel.style.display = '';
      findVideo();
      captureStartVideoTime = getVideoTime();
      lastFinalVideoTime = null;
      firstSentence = true;
    }

    if (msg.type === 'HIDE_PANEL') {
      if (panel) panel.style.display = 'none';
    }

    if (msg.type === 'VOSK_STATUS') {
      if (msg.connected) {
        setStatus('active', 'Vosk 已连接');
      } else {
        setStatus('', 'Vosk 未连接');
      }
    }

    if (msg.type === 'TRANSLATION_STREAM') {
      const placeholders = document.querySelectorAll('.la-translation-text.placeholder');
      const streamings = document.querySelectorAll('.la-translation-text.streaming');
      const target = placeholders[0] || streamings[0];
      if (target) {
        target.classList.remove('placeholder');
        target.classList.add('streaming');
        if (!translationVisible) target.classList.add('hidden');
        target.innerHTML = msg.text + '<span class="la-trans-cursor"></span>';
        scrollToBottom();
      }
    }

    if (msg.type === 'TRANSLATION_DONE') {
      const streamings = document.querySelectorAll('.la-translation-text.streaming');
      if (streamings.length > 0) {
        const el = streamings[0];
        el.classList.remove('streaming');
        el.textContent = msg.text;
        if (!translationVisible) el.classList.add('hidden');
      }
    }
  });

  createPanel();
})();
