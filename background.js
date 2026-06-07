let captureActive = false;
let activeTabId = null;

async function ensureOffscreenDocument() {
  const existing = await chrome.offscreen.hasDocument();
  if (!existing) {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'Processing tab audio capture stream'
    });
  }
}

function forwardToTab(msg) {
  if (activeTabId) {
    chrome.tabs.sendMessage(activeTabId, msg).catch(() => {});
  }
}

function forwardToPopup(msg) {
  chrome.runtime.sendMessage(msg).catch(() => {});
}

async function callAI(messages, stream, onChunk, onDone) {
  const settings = await new Promise((resolve) => {
    chrome.storage.local.get(['apiKey', 'apiBaseUrl', 'apiModel'], resolve);
  });

  const apiKey = settings.apiKey;
  if (!apiKey) return null;

  const baseUrl = settings.apiBaseUrl || 'https://api.deepseek.com/v1/chat/completions';
  const model = settings.apiModel || 'deepseek-chat';

  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        stream,
        messages,
        temperature: 0.3,
        max_tokens: 256
      })
    });

    if (!response.ok) {
      forwardToPopup({ type: 'POPUP_LOG', message: `API错误: ${response.status}`, logType: 'error' });
      return null;
    }

    if (!stream) {
      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || null;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') break;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            if (onChunk) onChunk(fullText);
          }
        } catch (e) {}
      }
    }

    if (onDone) onDone(fullText);
    return fullText;
  } catch (e) {
    forwardToPopup({ type: 'POPUP_LOG', message: `API失败: ${e.message}`, logType: 'error' });
    return null;
  }
}

async function lightCorrect(text, lang) {
  const settings = await new Promise((resolve) => {
    chrome.storage.local.get(['aiCorrection'], resolve);
  });

  if (!settings.aiCorrection) return text;

  const langNames = {
    en: 'English', zh: 'Chinese', ja: 'Japanese', ko: 'Korean',
    fr: 'French', de: 'German', es: 'Spanish', pt: 'Portuguese', ru: 'Russian'
  };

  const corrected = await callAI([
    {
      role: 'system',
      content: `You are a speech recognition post-processor for ${langNames[lang] || lang}. Fix ONLY obvious ASR errors like misheard homophones, garbled words, or impossible word combinations. Do NOT change: slang, idioms, informal speech, dialect, contractions, or anything that could be intentional. If the text is already correct, output it unchanged. Output ONLY the corrected text, nothing else.`
    },
    { role: 'user', content: text }
  ], false);

  return corrected || text;
}

async function streamTranslate(text, sourceLang, targetLang) {
  const settings = await new Promise((resolve) => {
    chrome.storage.local.get(['apiKey', 'sourceLang', 'targetLang'], resolve);
  });

  const apiKey = settings.apiKey;
  if (!apiKey) return;

  const target = targetLang || settings.targetLang || 'zh';
  const source = sourceLang || settings.sourceLang || 'en';

  const langNames = {
    en: 'English', zh: 'Chinese', ja: 'Japanese', ko: 'Korean',
    fr: 'French', de: 'German', es: 'Spanish', pt: 'Portuguese', ru: 'Russian'
  };

  await callAI(
    [
      {
        role: 'system',
        content: `You are a translator. Translate the following ${langNames[source] || source} text to ${langNames[target] || target}. Output ONLY the translation, nothing else. Keep it natural and concise.`
      },
      { role: 'user', content: text }
    ],
    true,
    (partial) => { forwardToTab({ type: 'TRANSLATION_STREAM', text: partial }); },
    (final) => { forwardToTab({ type: 'TRANSLATION_DONE', text: final }); }
  );
}

async function handleRequestTranslation(text, lang) {
  const corrected = await lightCorrect(text, lang);
  if (corrected !== text) {
    forwardToTab({ type: 'TEXT_CORRECTED', original: text, corrected, lang });
  }
  streamTranslate(corrected, lang);
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'TAB_CAPTURE_STARTED') {
    captureActive = true;
    forwardToPopup({ type: 'POPUP_CAPTURE_STATUS', active: true });
  }
  if (msg.type === 'TAB_CAPTURE_STOPPED') {
    captureActive = false;
    forwardToPopup({ type: 'POPUP_CAPTURE_STATUS', active: false });
  }
  if (msg.type === 'TAB_CAPTURE_ERROR') {
    captureActive = false;
    forwardToPopup({ type: 'POPUP_CAPTURE_ERROR', message: msg.message });
  }
  if (msg.type === 'AUDIO_LEVEL') {
    forwardToPopup(msg);
  }
  if (msg.type === 'VOSK_PARTIAL') {
    forwardToPopup(msg);
    forwardToTab(msg);
  }
  if (msg.type === 'VOSK_FINAL') {
    forwardToPopup(msg);
    forwardToTab(msg);
  }
  if (msg.type === 'VOSK_STATUS') {
    forwardToPopup(msg);
    forwardToTab(msg);
  }
  if (msg.type === 'VOSK_ERROR') {
    forwardToPopup(msg);
    forwardToTab(msg);
  }
  if (msg.type === 'VOSK_CONFIG') {
    forwardToPopup(msg);
    forwardToTab(msg);
  }
  if (msg.type === 'REQUEST_TRANSLATION') {
    handleRequestTranslation(msg.text, msg.lang);
  }
  if (msg.type === 'PAUSE_VOSK') {
    chrome.runtime.sendMessage({ type: 'OFFSCREEN_PAUSE_VOSK' }).catch(() => {});
  }
  if (msg.type === 'RESUME_VOSK') {
    chrome.runtime.sendMessage({ type: 'OFFSCREEN_RESUME_VOSK' }).catch(() => {});
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'START_CAPTURE') {
    if (captureActive) {
      sendResponse({ ok: true, message: 'already capturing' });
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (!tabs[0]) {
        sendResponse({ ok: false, message: 'no active tab' });
        return;
      }

      activeTabId = tabs[0].id;

      try {
        const streamId = await chrome.tabCapture.getMediaStreamId({
          targetTabId: tabs[0].id
        });

        await ensureOffscreenDocument();

        chrome.storage.local.get(['voskUrl', 'sourceLang', 'targetLang'], (res) => {
          chrome.runtime.sendMessage({
            type: 'OFFSCREEN_START_CAPTURE',
            streamId: streamId,
            voskUrl: res.voskUrl || 'ws://localhost:2700',
            lang: res.sourceLang || 'en'
          });
        });

        forwardToTab({ type: 'SHOW_PANEL' });
        sendResponse({ ok: true, message: 'capture started' });
      } catch (e) {
        sendResponse({ ok: false, message: e.message });
      }
    });

    return true;
  }

  if (msg.type === 'STOP_CAPTURE') {
    chrome.runtime.sendMessage({ type: 'OFFSCREEN_STOP_CAPTURE' }).catch(() => {});
    captureActive = false;
    activeTabId = null;
    sendResponse({ ok: true });
    return true;
  }

  if (msg.type === 'GET_STATUS') {
    sendResponse({ captureActive });
    return true;
  }

  if (msg.type === 'SWITCH_LANG') {
    chrome.storage.local.get(['voskUrl'], (res) => {
      chrome.runtime.sendMessage({
        type: 'OFFSCREEN_SWITCH_LANG',
        lang: msg.lang,
        voskUrl: res.voskUrl || 'ws://localhost:2700'
      });
    });
    sendResponse({ ok: true });
    return true;
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === activeTabId) {
    chrome.runtime.sendMessage({ type: 'OFFSCREEN_STOP_CAPTURE' }).catch(() => {});
    captureActive = false;
    activeTabId = null;
  }
});
