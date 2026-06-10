(() => {
  if (window.__languageAgentPanelCreated) return;
  window.__languageAgentPanelCreated = true;

  let panel = null;
  let subtitleList = null;
  let partialItem = null;
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };
  let dictCard = null;
  let dictAudio = null;
  let ctxMenu = null;
  let chatPanel = null;
  let chatHistory = [];

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
  let currentLang = 'en';
  let videoListenersAttached = false;
  let chatDragging = false;
  let chatDragOffset = { x: 0, y: 0 };

  const REPLAY_PRE_OVERLAP = 1.0;
  const REPLAY_POST_OVERLAP = 1.0;
  const STT_LATENCY = 0.8;
  const SENTENCE_END_RE = /[.!?。！？]$/;

  function getVideoTime() { findVideo(); return videoEl ? videoEl.currentTime : 0; }

  function findVideo() {
    if (videoEl && document.contains(videoEl)) return videoEl;
    videoEl = document.querySelector('video');
    if (videoEl && !videoListenersAttached) { attachVideoListeners(); videoListenersAttached = true; }
    return videoEl;
  }

  function attachVideoListeners() {
    if (!videoEl) return;
    videoEl.addEventListener('pause', onVideoPause);
    videoEl.addEventListener('play', onVideoPlay);
  }

  function onVideoPause() {
    if (isReplaying) return;
    if (voskLiveActive) {
      voskLiveActive = false;
      chrome.runtime.sendMessage({ type: 'PAUSE_VOSK' });
      if (partialItem) { partialItem.remove(); partialItem = null; }
      setStatus('', '已暂停 (视频暂停)');
    }
  }

  function onVideoPlay() {
    if (isReplaying) return;
    if (!voskLiveActive) {
      voskLiveActive = true;
      if (partialItem) { partialItem.remove(); partialItem = null; }
      chrome.runtime.sendMessage({ type: 'RESUME_VOSK' });
      captureStartVideoTime = getVideoTime();
      firstSentence = true;
      lastFinalVideoTime = null;
      setStatus('active', '监听中');
    }
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
      if (isNearBottom()) { userScrolling = false; return; }
      userScrolling = true;
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => { userScrolling = false; }, 5000);
    });
  }

  function splitSentences(text, words) {
    if (!words || words.length === 0) return [{ text, start: null, end: null }];
    const sentences = [];
    let sentWords = [];
    for (let i = 0; i < words.length; i++) {
      sentWords.push(words[i]);
      if (SENTENCE_END_RE.test(words[i].word) || i === words.length - 1) {
        sentences.push({
          text: sentWords.map(sw => sw.word).join(' '),
          start: sentWords[0].start,
          end: sentWords[sentWords.length - 1].end
        });
        sentWords = [];
      }
    }
    return sentences;
  }

  function wrapWords(text) {
    return text.replace(/([\w''-]+)/g, '<span class="la-word">$1</span>');
  }

  function createPanel() {
    panel = document.createElement('div');
    panel.id = 'language-agent-panel';
    panel.innerHTML = `
      <div id="la-header">
        <span id="la-title">Language Agent</span>
        <div id="la-controls">
          <button id="la-ask-btn" title="AI 问答">&#10067;</button>
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
        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
        width: 720px; max-height: 420px;
        background: rgba(10, 10, 22, 0.96);
        border: 1px solid rgba(233, 69, 96, 0.25); border-radius: 16px;
        box-shadow: 0 12px 48px rgba(0,0,0,0.6);
        z-index: 2147483647;
        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        color: #e0e0e0; display: flex; flex-direction: column;
        overflow: hidden; backdrop-filter: blur(16px);
        transition: max-height 0.3s ease, width 0.3s ease;
      }
      #language-agent-panel.minimized { max-height: 44px; width: 220px; transform: translateX(-50%); }
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
      #la-ask-btn { font-size: 13px !important; }
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
        padding: 10px 14px; background: rgba(255,255,255,0.04);
        border-radius: 10px; border-left: 4px solid #4caf50;
        animation: la-fadein 0.15s ease;
        transition: background 0.15s, border-left-color 0.15s;
        position: relative;
      }
      .la-item-group.partial-group { border-left-color: #ff9800; }
      .la-item-group.replaying {
        background: rgba(233, 69, 96, 0.12);
        border-left-color: #e94560;
        box-shadow: 0 0 0 1px rgba(233, 69, 96, 0.2);
      }

      .la-source-text {
        font-size: 20px; line-height: 1.5; word-break: break-word;
        color: #f0f0f0; font-weight: 500; cursor: text; user-select: text;
      }
      .la-source-text.partial { color: #999; font-weight: 400; font-size: 18px; cursor: default; user-select: none; }
      .la-source-text.partial .la-cursor {
        display: inline-block; width: 2px; height: 18px;
        background: #ff9800; margin-left: 3px; vertical-align: middle;
        animation: la-blink 0.8s infinite;
      }
      .la-word { cursor: pointer; border-radius: 3px; transition: background 0.15s; padding: 0 1px; }
      .la-word:hover { background: rgba(233, 69, 96, 0.2); }

      .la-translation-text {
        font-size: 16px; line-height: 1.4; word-break: break-word;
        color: #64b5f6; margin-top: 5px; padding-top: 5px;
        border-top: 1px dashed rgba(100, 181, 246, 0.2);
      }
      .la-translation-text.placeholder { color: #3a3a3a; font-style: italic; font-size: 14px; }
      .la-translation-text.hidden { display: none; }
      .la-translation-text.streaming .la-trans-cursor {
        display: inline-block; width: 2px; height: 14px;
        background: #64b5f6; margin-left: 2px; vertical-align: middle;
        animation: la-blink 0.6s infinite;
      }

      .la-item-meta { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
      .la-lang-label { font-size: 10px; color: #555; }
      .la-replay-btn {
        display: inline-flex; align-items: center; justify-content: center;
        gap: 5px; min-width: 72px; padding: 4px 14px;
        font-size: 12px; font-weight: 600; color: #ccc;
        background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
        border-radius: 16px; cursor: pointer; transition: all 0.2s; user-select: none;
      }
      .la-replay-btn:hover {
        background: rgba(233, 69, 96, 0.15);
        border-color: rgba(233, 69, 96, 0.4); color: #e94560;
      }
      .la-replay-btn.playing {
        background: rgba(233, 69, 96, 0.2);
        border-color: rgba(233, 69, 96, 0.5); color: #e94560;
      }
      .la-replay-btn.paused {
        background: rgba(255, 152, 0, 0.15);
        border-color: rgba(255, 152, 0, 0.4); color: #ff9800;
      }
      .la-time-label { font-size: 10px; color: #444; margin-left: auto; }

      @keyframes la-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      @keyframes la-fadein {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: translateY(0); }
      }

      #la-ctx-menu {
        position: fixed; z-index: 2147483646;
        padding: 4px 0; background: rgba(18, 18, 36, 0.98);
        border: 1px solid rgba(233, 69, 96, 0.3); border-radius: 8px;
        box-shadow: 0 6px 24px rgba(0,0,0,0.5);
        font-family: 'Segoe UI', system-ui, sans-serif;
        backdrop-filter: blur(12px); min-width: 140px;
      }
      .la-ctx-item {
        padding: 8px 16px; color: #e0e0e0; font-size: 13px;
        cursor: pointer; display: flex; align-items: center; gap: 8px;
        transition: background 0.15s;
      }
      .la-ctx-item:hover { background: rgba(233, 69, 96, 0.15); color: #e94560; }

      #la-dict-card {
        position: fixed; z-index: 2147483647;
        width: 300px; padding: 14px 16px;
        background: rgba(18, 18, 36, 0.98);
        border: 1px solid rgba(100, 181, 246, 0.3); border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        font-family: 'Segoe UI', system-ui, sans-serif; color: #e0e0e0;
        backdrop-filter: blur(12px);
      }
      .la-dict-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
      .la-dict-word { font-size: 22px; font-weight: 700; color: #f0f0f0; }
      .la-dict-phonetic { font-size: 14px; color: #aaa; font-style: italic; }
      .la-dict-audio-btn {
        background: rgba(100,181,246,0.15); border: none; color: #64b5f6;
        cursor: pointer; font-size: 16px; padding: 2px 8px; border-radius: 50%;
        transition: background 0.2s;
      }
      .la-dict-audio-btn:hover { background: rgba(100,181,246,0.3); }
      .la-dict-definitions { display: flex; flex-direction: column; gap: 6px; }
      .la-dict-pos { font-size: 11px; color: #e94560; font-weight: 600; text-transform: uppercase; }
      .la-dict-def { font-size: 13px; color: #ccc; line-height: 1.4; padding-left: 8px; border-left: 2px solid #333; }
      .la-dict-loading { font-size: 13px; color: #666; font-style: italic; }
      .la-dict-error { font-size: 13px; color: #e94560; }
      .la-dict-source { font-size: 9px; color: #444; margin-top: 6px; text-align: right; }

      #la-chat-panel {
        position: fixed; z-index: 2147483647;
        width: 440px; height: 520px;
        background: rgba(12, 12, 24, 0.98);
        border: 1px solid rgba(233, 69, 96, 0.3); border-radius: 16px;
        box-shadow: 0 12px 48px rgba(0,0,0,0.6);
        font-family: 'Segoe UI', system-ui, sans-serif; color: #e0e0e0;
        display: flex; flex-direction: column; overflow: hidden;
        backdrop-filter: blur(16px); top: 80px; left: 50%; transform: translateX(-50%);
      }
      #la-chat-header {
        display: flex; justify-content: space-between; align-items: center;
        padding: 12px 16px; background: rgba(22, 33, 62, 0.9);
        border-bottom: 1px solid rgba(233,69,96,0.2); flex-shrink: 0;
        cursor: move; user-select: none;
      }
      #la-chat-title { font-size: 14px; font-weight: 700; color: #e94560; }
      #la-chat-close {
        background: none; border: none; color: #888; cursor: pointer;
        font-size: 16px; padding: 2px 8px; border-radius: 4px;
      }
      #la-chat-close:hover { color: #e0e0e0; background: rgba(255,255,255,0.1); }
      #la-chat-context {
        padding: 8px 16px; background: rgba(100,181,246,0.06);
        border-bottom: 1px solid rgba(100,181,246,0.15);
        font-size: 13px; color: #64b5f6; line-height: 1.4;
        max-height: 80px; overflow-y: auto; flex-shrink: 0;
      }
      #la-chat-context-label { font-size: 10px; color: #555; margin-bottom: 4px; }
      #la-chat-messages {
        flex: 1; overflow-y: auto; padding: 12px 16px;
        display: flex; flex-direction: column; gap: 10px;
      }
      .la-chat-msg { font-size: 13px; line-height: 1.5; word-break: break-word; padding: 8px 12px; border-radius: 10px; }
      .la-chat-msg.user { background: rgba(233,69,96,0.12); align-self: flex-end; max-width: 85%; }
      .la-chat-msg.assistant { background: rgba(255,255,255,0.05); align-self: flex-start; max-width: 90%; }
      .la-chat-msg.system { background: rgba(100,181,246,0.08); color: #64b5f6; font-size: 11px; align-self: center; }
      .la-chat-msg.streaming .la-chat-cursor {
        display: inline-block; width: 2px; height: 12px;
        background: #4caf50; margin-left: 2px; vertical-align: middle;
        animation: la-blink 0.6s infinite;
      }
      #la-chat-input-row {
        display: flex; gap: 8px; padding: 12px 16px;
        background: rgba(22, 33, 62, 0.9); border-top: 1px solid rgba(233,69,96,0.2); flex-shrink: 0;
      }
      #la-chat-input {
        flex: 1; padding: 8px 12px; border-radius: 8px;
        border: 1px solid #0f3460; background: #16213e; color: #e0e0e0;
        font-size: 13px; outline: none; resize: none; min-height: 36px; max-height: 80px;
      }
      #la-chat-input:focus { border-color: #e94560; }
      #la-chat-send {
        padding: 8px 18px; border: none; border-radius: 8px;
        background: #e94560; color: #fff; font-size: 13px; font-weight: 600;
        cursor: pointer; transition: background 0.2s; white-space: nowrap;
      }
      #la-chat-send:hover { background: #c73e54; }
      #la-chat-send:disabled { background: #444; cursor: not-allowed; }

      #la-footer {
        display: flex; align-items: center; gap: 8px;
        padding: 8px 18px; background: rgba(22, 33, 62, 0.6); flex-shrink: 0;
      }
      .la-status-dot { width: 7px; height: 7px; border-radius: 50%; background: #555; flex-shrink: 0; }
      .la-status-dot.active { background: #4caf50; animation: la-pulse 1s infinite; }
      .la-status-dot.partial { background: #ff9800; animation: la-pulse 1s infinite; }
      .la-status-dot.replaying { background: #e94560; animation: la-pulse 0.6s infinite; }
      @keyframes la-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      #la-status-text { font-size: 11px; color: #888; flex: 1; }
      #la-lang-badge {
        font-size: 10px; padding: 2px 10px; border-radius: 10px;
        background: rgba(233, 69, 96, 0.15); color: #e94560;
      }

      #la-body::-webkit-scrollbar, #la-chat-messages::-webkit-scrollbar, #la-chat-context::-webkit-scrollbar { width: 4px; }
      #la-body::-webkit-scrollbar-track, #la-chat-messages::-webkit-scrollbar-track, #la-chat-context::-webkit-scrollbar-track { background: transparent; }
      #la-body::-webkit-scrollbar-thumb, #la-chat-messages::-webkit-scrollbar-thumb, #la-chat-context::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
    `;

    document.documentElement.appendChild(style);
    document.documentElement.appendChild(panel);
    subtitleList = document.getElementById('la-subtitle-list');

    setupDrag();
    setupControls();
    setupScrollDetection();
    setupWordClick();
    setupSelectionDetection();
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
      panel.style.right = 'auto'; panel.style.bottom = 'auto'; panel.style.transform = 'none';
    });
    document.addEventListener('mouseup', () => { isDragging = false; panel.style.transition = ''; });
  }

  function setupControls() {
    document.getElementById('la-minimize-btn').addEventListener('click', () => { panel.classList.toggle('minimized'); });
    document.getElementById('la-close-btn').addEventListener('click', () => { panel.style.display = 'none'; });
    document.getElementById('la-scroll-btn').addEventListener('click', () => { userScrolling = false; scrollToBottom(); });
    const transBtn = document.getElementById('la-trans-btn');
    transBtn.classList.add('off');
    transBtn.addEventListener('click', () => {
      translationVisible = !translationVisible;
      transBtn.className = translationVisible ? 'on' : 'off';
      document.querySelectorAll('.la-translation-text').forEach((el) => { el.classList.toggle('hidden', !translationVisible); });
    });
    document.getElementById('la-live-btn').addEventListener('click', () => { returnToLive(); });
    document.getElementById('la-ask-btn').addEventListener('click', () => { openChat(''); });
  }

  function setupWordClick() {
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('la-word')) {
        e.stopPropagation();
        const word = e.target.textContent.replace(/[^a-zA-Z\u00C0-\u024F\u0400-\u04FF\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff'-]/g, '');
        if (word) showDictCard(word, e.target);
        return;
      }
      if (dictCard && !dictCard.contains(e.target)) hideDictCard();
    });
  }

  function setupSelectionDetection() {
    document.addEventListener('contextmenu', (e) => {
      if (!subtitleList || !subtitleList.contains(e.target)) {
        hideCtxMenu();
        return;
      }
      const sel = window.getSelection();
      const text = sel.toString().trim();
      if (!text) {
        hideCtxMenu();
        return;
      }
      e.preventDefault();
      showCtxMenu(text, e.clientX, e.clientY);
    });

    document.addEventListener('click', (e) => {
      if (ctxMenu && !ctxMenu.contains(e.target)) hideCtxMenu();
    });
  }

  function showCtxMenu(text, x, y) {
    if (!ctxMenu) {
      ctxMenu = document.createElement('div');
      ctxMenu.id = 'la-ctx-menu';
      document.documentElement.appendChild(ctxMenu);
    }
    ctxMenu.innerHTML = '<div class="la-ctx-item" data-action="ask-ai">🤖 问 AI</div>';
    ctxMenu.style.display = '';
    if (x + 160 > window.innerWidth) x = window.innerWidth - 170;
    if (y + 40 > window.innerHeight) y = window.innerHeight - 50;
    ctxMenu.style.left = `${x}px`;
    ctxMenu.style.top = `${y}px`;

    ctxMenu.querySelector('[data-action="ask-ai"]').addEventListener('click', () => {
      window.getSelection().removeAllRanges();
      hideCtxMenu();
      openChat(text);
    });
  }

  function hideCtxMenu() {
    if (ctxMenu) ctxMenu.style.display = 'none';
  }

  function showDictCard(word, anchorEl) {
    if (!dictCard) {
      dictCard = document.createElement('div');
      dictCard.id = 'la-dict-card';
      document.documentElement.appendChild(dictCard);
    }
    dictCard.innerHTML = `<div class="la-dict-loading">Loading...</div>`;
    dictCard.style.display = '';
    const rect = anchorEl.getBoundingClientRect();
    let top = rect.bottom + 8;
    let left = rect.left;
    if (top + 250 > window.innerHeight) top = rect.top - 258;
    if (left + 300 > window.innerWidth) left = window.innerWidth - 310;
    if (left < 10) left = 10;
    dictCard.style.top = `${top}px`; dictCard.style.left = `${left}px`;
    if (currentLang === 'en') lookupFreeDictionary(word);
    else lookupWiktionary(word, currentLang);
  }

  function hideDictCard() {
    if (dictCard) dictCard.style.display = 'none';
    if (dictAudio) { dictAudio.pause(); dictAudio = null; }
  }

  async function lookupFreeDictionary(word) {
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      if (!res.ok) throw new Error('not found');
      const data = await res.json();
      const entry = data[0];
      const phonetic = entry.phonetic || entry.phonetics?.find(p => p.text)?.text || '';
      const audioUrl = entry.phonetics?.find(p => p.audio)?.audio || '';
      let html = '<div class="la-dict-header">';
      html += `<span class="la-dict-word">${entry.word}</span>`;
      if (phonetic) html += `<span class="la-dict-phonetic">${phonetic}</span>`;
      if (audioUrl) html += `<button class="la-dict-audio-btn" data-audio="${audioUrl}">&#9654;</button>`;
      html += '</div><div class="la-dict-definitions">';
      for (const meaning of entry.meanings || []) {
        html += `<div class="la-dict-pos">${meaning.partOfSpeech}</div>`;
        for (const def of meaning.definitions?.slice(0, 3) || []) {
          html += `<div class="la-dict-def">${def.definition}</div>`;
        }
      }
      html += '</div><div class="la-dict-source">Free Dictionary API</div>';
      dictCard.innerHTML = html;
      const audioBtn = dictCard.querySelector('.la-dict-audio-btn');
      if (audioBtn) {
        audioBtn.addEventListener('click', () => {
          if (dictAudio) dictAudio.pause();
          dictAudio = new Audio(audioBtn.dataset.audio);
          dictAudio.play();
        });
      }
    } catch (e) {
      dictCard.innerHTML = `<div class="la-dict-word">${word}</div><div class="la-dict-error">未找到释义</div>`;
    }
  }

  async function lookupWiktionary(word, lang) {
    try {
      const res = await fetch(`https://${lang}.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`);
      if (!res.ok) throw new Error('not found');
      const data = await res.json();
      let html = '<div class="la-dict-header"><span class="la-dict-word">${word}</span></div><div class="la-dict-definitions">';
      const defs = data[lang] || [];
      for (const section of defs.slice(0, 2)) {
        const pos = section.partOfSpeech || '';
        if (pos) html += `<div class="la-dict-pos">${pos}</div>`;
        for (const def of section.definitions?.slice(0, 3) || []) {
          const text = def.definition?.replace(/<[^>]+>/g, '') || '';
          if (text) html += `<div class="la-dict-def">${text}</div>`;
        }
      }
      html += '</div><div class="la-dict-source">Wiktionary</div>';
      dictCard.innerHTML = html;
    } catch (e) {
      dictCard.innerHTML = `<div class="la-dict-word">${word}</div><div class="la-dict-error">未找到释义</div>`;
    }
  }

  function setupChatDrag() {
    const header = document.getElementById('la-chat-header');
    header.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      chatDragging = true;
      const rect = chatPanel.getBoundingClientRect();
      chatDragOffset.x = e.clientX - rect.left;
      chatDragOffset.y = e.clientY - rect.top;
      chatPanel.style.left = `${rect.left}px`;
      chatPanel.style.top = `${rect.top}px`;
      chatPanel.style.right = 'auto';
      chatPanel.style.transform = 'none';
      chatPanel.style.transition = 'none';
    });
    document.addEventListener('mousemove', (e) => {
      if (!chatDragging) return;
      chatPanel.style.left = `${e.clientX - chatDragOffset.x}px`;
      chatPanel.style.top = `${e.clientY - chatDragOffset.y}px`;
    });
    document.addEventListener('mouseup', () => { chatDragging = false; chatPanel.style.transition = ''; });
  }

  function openChat(selectedText) {
    if (!chatPanel) {
      chatPanel = document.createElement('div');
      chatPanel.id = 'la-chat-panel';
      chatPanel.innerHTML = `
        <div id="la-chat-header">
          <span id="la-chat-title">AI 问答</span>
          <button id="la-chat-close">✕</button>
        </div>
        <div id="la-chat-context">
          <div id="la-chat-context-label">上下文 (选中的文字)</div>
          <div id="la-chat-context-text"></div>
        </div>
        <div id="la-chat-messages"></div>
        <div id="la-chat-input-row">
          <textarea id="la-chat-input" placeholder="输入你的问题..." rows="1"></textarea>
          <button id="la-chat-send">发送</button>
        </div>
      `;
      document.documentElement.appendChild(chatPanel);

      document.getElementById('la-chat-close').addEventListener('click', () => { chatPanel.style.display = 'none'; });
      document.getElementById('la-chat-send').addEventListener('click', sendChatMessage);
      document.getElementById('la-chat-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
      });

      setupChatDrag();
    }

    chatPanel.style.display = '';
    const contextText = document.getElementById('la-chat-context-text');
    const contextDiv = document.getElementById('la-chat-context');
    if (selectedText) {
      contextText.textContent = selectedText;
      contextDiv.style.display = '';
    } else {
      contextDiv.style.display = 'none';
    }

    document.getElementById('la-chat-input').focus();
  }

  async function sendChatMessage() {
    const input = document.getElementById('la-chat-input');
    const question = input.value.trim();
    if (!question) return;

    const contextText = document.getElementById('la-chat-context-text')?.textContent || '';
    input.value = '';
    input.style.height = '36px';

    addChatMsg('user', question);

    if (contextText) {
      addChatMsg('system', `上下文: "${contextText}"`);
    }

    const sendBtn = document.getElementById('la-chat-send');
    sendBtn.disabled = true;

    const fullQuestion = contextText
      ? `以下是用户选中的原文:\n"${contextText}"\n\n用户的问题: ${question}\n\n请用中文回答，如果原文是外语请附上原文解析。`
      : question;

    chatHistory.push({ role: 'user', content: fullQuestion });

    const assistantDiv = addChatMsg('assistant', '');
    assistantDiv.classList.add('streaming');
    assistantDiv.dataset.chatStreaming = 'true';

    chrome.runtime.sendMessage({
      type: 'CHAT_ASK',
      messages: chatHistory
    });
  }

  function addChatMsg(role, text) {
    const messages = document.getElementById('la-chat-messages');
    const div = document.createElement('div');
    div.className = `la-chat-msg ${role}`;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
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

  function addFinal(text, lang, words) {
    if (!subtitleList) return;
    currentLang = lang || 'en';
    const sentences = splitSentences(text, words);
    const now = getVideoTime();
    const utteranceEnd = Math.max(0, now - STT_LATENCY);
    if (partialItem) { partialItem.remove(); partialItem = null; }

    const speechDuration = (words && words.length > 0)
      ? words[words.length - 1].end - words[0].start
      : 1.5;

    let utteranceStart = utteranceEnd - speechDuration;
    if (firstSentence && captureStartVideoTime != null) {
      utteranceStart = Math.max(utteranceStart, captureStartVideoTime);
    }
    if (lastFinalVideoTime != null) {
      utteranceStart = Math.max(utteranceStart, lastFinalVideoTime);
    }
    if (utteranceStart >= utteranceEnd) utteranceStart = Math.max(0, utteranceEnd - 0.5);

    const voskStart = (words && words.length > 0) ? words[0].start : 0;
    const voskRange = Math.max(speechDuration, 0.1);
    const videoRange = utteranceEnd - utteranceStart;

    for (const sent of sentences) {
      let startTime, endTime;
      if (sent.start != null && sent.end != null && words && words.length > 0) {
        startTime = utteranceStart + ((sent.start - voskStart) / voskRange) * videoRange;
        endTime = utteranceStart + ((sent.end - voskStart) / voskRange) * videoRange;
      } else {
        startTime = utteranceStart;
        endTime = utteranceEnd;
      }
      lastFinalVideoTime = endTime;
      createSubtitleItem(sent.text, lang, startTime, endTime);
    }
    firstSentence = false;
    chrome.runtime.sendMessage({ type: 'REQUEST_TRANSLATION', text, lang });
  }

  function createSubtitleItem(text, lang, startTime, endTime) {
    const group = document.createElement('div');
    group.className = 'la-item-group';
    group.dataset.startTime = startTime.toFixed(2);
    group.dataset.endTime = endTime.toFixed(2);

    const sourceDiv = document.createElement('div');
    sourceDiv.className = 'la-source-text';
    sourceDiv.innerHTML = wrapWords(text);

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
    replayBtn.addEventListener('click', (e) => { e.stopPropagation(); handleReplayClick(group, replayBtn); });

    const timeLabel = document.createElement('span');
    timeLabel.className = 'la-time-label';
    timeLabel.textContent = formatTime(startTime);

    metaDiv.appendChild(langLabel); metaDiv.appendChild(replayBtn); metaDiv.appendChild(timeLabel);
    group.appendChild(sourceDiv); group.appendChild(transDiv); group.appendChild(metaDiv);
    subtitleList.appendChild(group);
    scrollToBottom();
    while (subtitleList.children.length > 80) subtitleList.removeChild(subtitleList.firstChild);
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function handleReplayClick(group, btn) {
    findVideo();
    if (!videoEl) return;
    if (!isReplaying) startReplay(group, btn);
    else if (isReplaying && !isReplayPaused) pauseReplay(btn);
    else if (isReplaying && isReplayPaused) resumeReplay(btn);
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

    isReplaying = true; isReplayPaused = false; replayGroup = group; voskLiveActive = false;
    document.getElementById('la-live-btn').style.display = '';
    chrome.runtime.sendMessage({ type: 'PAUSE_VOSK' });
    if (partialItem) { partialItem.remove(); partialItem = null; }

    document.querySelectorAll('.la-item-group.replaying').forEach((el) => { el.classList.remove('replaying'); });
    document.querySelectorAll('.la-replay-btn.playing, .la-replay-btn.paused').forEach((el) => {
      el.className = 'la-replay-btn'; el.innerHTML = '&#9654; 回放';
    });
    group.classList.add('replaying');
    btn.className = 'la-replay-btn playing'; btn.innerHTML = '&#10074;&#10074; 暂停';

    videoEl.pause();
    videoEl.currentTime = startTime;
    await new Promise((r) => { videoEl.addEventListener('seeked', r, { once: true }); });
    videoEl.play();
    setStatus('replaying', '回放中...');

    const checkEnd = () => {
      if (!isReplaying || isReplayPaused) return;
      if (videoEl.currentTime >= endTime) { stopReplay(); return; }
      requestAnimationFrame(checkEnd);
    };
    requestAnimationFrame(checkEnd);
    replayTimeout = setTimeout(() => { stopReplay(); }, (endTime - startTime + 0.5) * 1000);
  }

  function pauseReplay(btn) {
    isReplayPaused = true;
    if (videoEl) videoEl.pause();
    if (replayTimeout) { clearTimeout(replayTimeout); replayTimeout = null; }
    btn.className = 'la-replay-btn paused'; btn.innerHTML = '&#9654; 继续';
    setStatus('active', '回放暂停');
  }

  function resumeReplay(btn) {
    isReplayPaused = false;
    if (videoEl) videoEl.play();
    btn.className = 'la-replay-btn playing'; btn.innerHTML = '&#10074;&#10074; 暂停';
    setStatus('replaying', '回放中...');
    const endTime = parseFloat(replayGroup.dataset.endTime) + REPLAY_POST_OVERLAP;
    const checkEnd = () => {
      if (!isReplaying || isReplayPaused) return;
      if (videoEl.currentTime >= endTime) { stopReplay(); return; }
      requestAnimationFrame(checkEnd);
    };
    requestAnimationFrame(checkEnd);
    const remaining = (endTime - videoEl.currentTime + 0.5) * 1000;
    if (remaining > 0) replayTimeout = setTimeout(() => { stopReplay(); }, remaining);
  }

  function stopReplay() {
    isReplaying = false; isReplayPaused = false; replayGroup = null; voskLiveActive = false;
    if (replayTimeout) { clearTimeout(replayTimeout); replayTimeout = null; }
    if (videoEl) videoEl.pause();
    document.querySelectorAll('.la-item-group.replaying').forEach((el) => { el.classList.remove('replaying'); });
    document.querySelectorAll('.la-replay-btn.playing, .la-replay-btn.paused').forEach((el) => {
      el.className = 'la-replay-btn'; el.innerHTML = '&#9654; 回放';
    });
    setStatus('active', '回放结束 - 点击 ▶▶ 直播 继续');
  }

  async function returnToLive() {
    findVideo();
    if (!videoEl) return;
    isReplaying = false; isReplayPaused = false; replayGroup = null; voskLiveActive = true;
    if (replayTimeout) { clearTimeout(replayTimeout); replayTimeout = null; }
    document.querySelectorAll('.la-item-group.replaying').forEach((el) => { el.classList.remove('replaying'); });
    document.querySelectorAll('.la-replay-btn.playing, .la-replay-btn.paused').forEach((el) => {
      el.className = 'la-replay-btn'; el.innerHTML = '&#9654; 回放';
    });
    document.getElementById('la-live-btn').style.display = 'none';

    const targetTime = preReplayTime != null ? preReplayTime : videoEl.currentTime;
    videoEl.currentTime = targetTime;
    await new Promise((r) => { videoEl.addEventListener('seeked', r, { once: true }); });
    videoEl.play();
    preReplayTime = null;

    chrome.runtime.sendMessage({ type: 'RESUME_VOSK' });
    setStatus('active', '监听中');
    captureStartVideoTime = getVideoTime();
    firstSentence = true; lastFinalVideoTime = null;
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
      if (msg.text) { updatePartial(msg.text); setStatus('partial', '识别中...'); setLangBadge(msg.lang); }
    }

    if (msg.type === 'VOSK_FINAL') {
      if (!voskLiveActive) return;
      if (!panel) createPanel();
      if (msg.text) { addFinal(msg.text, msg.lang, msg.words); setStatus('active', '监听中'); setLangBadge(msg.lang); }
    }

    if (msg.type === 'VOSK_CONFIG') { setLangBadge(msg.config?.language); }

    if (msg.type === 'TEXT_CORRECTED') {
      if (!subtitleList) return;
      const items = subtitleList.querySelectorAll('.la-source-text:not(.partial)');
      for (const item of items) {
        const plainText = item.textContent;
        if (plainText === msg.original || plainText.includes(msg.original)) {
          item.innerHTML = wrapWords(msg.corrected);
          item.title = `原文: ${msg.original}`;
          item.style.textDecoration = 'underline'; item.style.textDecorationStyle = 'dotted';
          item.style.textUnderlineOffset = '3px'; item.style.textDecorationColor = 'rgba(233,69,96,0.4)';
          break;
        }
      }
    }

    if (msg.type === 'SHOW_PANEL') {
      if (!panel) createPanel();
      panel.style.display = ''; findVideo();
      captureStartVideoTime = getVideoTime();
      lastFinalVideoTime = null; firstSentence = true;
    }

    if (msg.type === 'HIDE_PANEL') { if (panel) panel.style.display = 'none'; }

    if (msg.type === 'VOSK_STATUS') {
      if (msg.connected) setStatus('active', 'Vosk 已连接');
      else setStatus('', 'Vosk 未连接');
    }

    if (msg.type === 'TRANSLATION_STREAM') {
      const placeholders = document.querySelectorAll('.la-translation-text.placeholder');
      const streamings = document.querySelectorAll('.la-translation-text.streaming');
      const target = placeholders[0] || streamings[0];
      if (target) {
        target.classList.remove('placeholder'); target.classList.add('streaming');
        if (!translationVisible) target.classList.add('hidden');
        target.innerHTML = msg.text + '<span class="la-trans-cursor"></span>'; scrollToBottom();
      }
    }

    if (msg.type === 'TRANSLATION_DONE') {
      const streamings = document.querySelectorAll('.la-translation-text.streaming');
      if (streamings.length > 0) {
        const el = streamings[0]; el.classList.remove('streaming');
        el.textContent = msg.text; if (!translationVisible) el.classList.add('hidden');
      }
    }

    if (msg.type === 'CHAT_STREAM') {
      const msgs = document.querySelectorAll('.la-chat-msg.assistant.streaming');
      if (msgs.length > 0) {
        msgs[0].innerHTML = msg.text + '<span class="la-chat-cursor"></span>';
        document.getElementById('la-chat-messages').scrollTop = document.getElementById('la-chat-messages').scrollHeight;
      }
    }

    if (msg.type === 'CHAT_DONE') {
      const msgs = document.querySelectorAll('.la-chat-msg.assistant.streaming');
      if (msgs.length > 0) {
        msgs[0].textContent = msg.text;
        msgs[0].classList.remove('streaming');
        chatHistory.push({ role: 'assistant', content: msg.text });
        const sendBtn = document.getElementById('la-chat-send');
        if (sendBtn) sendBtn.disabled = false;
      }
    }
  });

  createPanel();
})();
