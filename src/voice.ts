import { state } from './state';
import { streamChatMessage, textToSpeech } from './api';
import { addMessage, updateChatSessionMeta, removeTypingIndicators, addTypingIndicator } from './ui';
import { ensureSystemPromptLoaded, buildDynamicSystemPrompt } from './chat';

type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking';

// SpeechRecognition types (vendor-prefixed in most browsers)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: Event & { error: string }) => void) | null;
  onaudiostart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

let recognition: SpeechRecognitionInstance | null = null;
let ttsQueue: string[] = [];
let isPlayingTTS = false;
const prefetchedAudio: Map<string, Blob> = new Map();
let overlayEl: HTMLElement | null = null;
let shouldRestartRecognition = false;

export function isWebSpeechSupported(): boolean {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

function setVoiceStatus(status: VoiceStatus): void {
  state.voiceStatus = status;
  updateOverlayUI(status);
}

function updateOverlayUI(status: VoiceStatus): void {
  if (!overlayEl) return;

  const orb = overlayEl.querySelector('.voice-orb') as HTMLElement;
  const statusText = overlayEl.querySelector('.voice-status-text') as HTMLElement;
  const transcriptEl = overlayEl.querySelector('.voice-transcript') as HTMLElement;

  if (!orb || !statusText) return;

  orb.classList.remove('listening', 'processing', 'speaking');

  switch (status) {
    case 'idle':
      statusText.textContent = 'Klaar om te luisteren';
      break;
    case 'listening':
      orb.classList.add('listening');
      statusText.textContent = 'Luistert...';
      break;
    case 'processing':
      orb.classList.add('processing');
      statusText.textContent = 'Denkt na...';
      break;
    case 'speaking':
      orb.classList.add('speaking');
      statusText.textContent = 'Spreekt...';
      break;
  }

  if (status === 'listening' && transcriptEl) {
    transcriptEl.textContent = '';
    transcriptEl.classList.remove('interim');
  }
}

function createOverlayHTML(): string {
  return `
    <div class="voice-overlay" id="voice-overlay">
      <button type="button" class="voice-close-btn" id="voice-close-btn" title="Sluiten" aria-label="Spraakgesprek sluiten">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
      <div class="voice-center">
        <div class="voice-orb">
          <div class="voice-orb-inner"></div>
          <div class="voice-orb-ring"></div>
          <div class="voice-orb-ring voice-orb-ring-2"></div>
        </div>
        <div class="voice-status-text">Klaar om te luisteren</div>
        <div class="voice-transcript"></div>
      </div>
      <button type="button" class="voice-stop-btn" id="voice-stop-btn">Stop spraakgesprek</button>
    </div>
  `;
}

export function openVoiceOverlay(): void {
  if (!isWebSpeechSupported()) {
    addMessage('Systeem', 'Spraakherkenning wordt niet ondersteund in deze browser. Gebruik Chrome of Edge.', 'system');
    return;
  }

  if (!state.currentScenario) {
    addMessage('Systeem', 'Start eerst een gesprek voordat je de spraakmodus opent.', 'system');
    return;
  }

  const container = document.createElement('div');
  container.innerHTML = createOverlayHTML();
  overlayEl = container.firstElementChild as HTMLElement;
  document.body.appendChild(overlayEl);

  void overlayEl.offsetHeight;
  overlayEl.classList.add('active');

  state.voiceOverlayActive = true;

  overlayEl.querySelector('#voice-close-btn')?.addEventListener('click', closeVoiceOverlay);
  overlayEl.querySelector('#voice-stop-btn')?.addEventListener('click', closeVoiceOverlay);

  startRecognition();
}

export function closeVoiceOverlay(): void {
  state.voiceOverlayActive = false;
  shouldRestartRecognition = false;

  if (recognition) {
    recognition.onend = null;
    recognition.abort();
    recognition = null;
  }

  stopCurrentAudio();

  ttsQueue = [];
  isPlayingTTS = false;
  prefetchedAudio.clear();

  if (state.voiceStreamController) {
    state.voiceStreamController.abort();
    state.voiceStreamController = null;
  }

  setVoiceStatus('idle');

  if (overlayEl) {
    overlayEl.classList.remove('active');
    const elToRemove = overlayEl;
    overlayEl = null;
    elToRemove.addEventListener('transitionend', () => {
      elToRemove.remove();
    }, { once: true });
    // Fallback if transitionend does not fire
    setTimeout(() => {
      elToRemove.remove();
    }, 400);
  }
}

function startRecognition(): void {
  if (!state.voiceOverlayActive) return;

  const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognitionClass();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'nl-NL';
  shouldRestartRecognition = true;

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    if (!state.voiceOverlayActive) return;

    const transcriptEl = overlayEl?.querySelector('.voice-transcript') as HTMLElement;

    if (state.voiceStatus === 'speaking') {
      handleBargeIn();
    }

    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        finalTranscript += result[0].transcript;
      } else {
        interimTranscript += result[0].transcript;
      }
    }

    if (transcriptEl) {
      if (finalTranscript) {
        transcriptEl.textContent = finalTranscript;
        transcriptEl.classList.remove('interim');
      } else if (interimTranscript) {
        transcriptEl.textContent = interimTranscript;
        transcriptEl.classList.add('interim');
      }
    }

    if (finalTranscript.trim()) {
      handleUserSpeech(finalTranscript.trim());
    }
  };

  recognition.onend = () => {
    if (state.voiceOverlayActive && shouldRestartRecognition && state.voiceStatus !== 'processing') {
      try {
        recognition?.start();
      } catch {
        // May fail if already started
      }
    }
  };

  recognition.onerror = (event: Event & { error: string }) => {
    if (event.error === 'aborted' || event.error === 'no-speech') return;
    console.error('SpeechRecognition error:', event.error);
    if (event.error === 'not-allowed') {
      addMessage('Systeem', 'Microfoontoegang geweigerd. Sta microfoon toe in je browserinstellingen.', 'system');
      closeVoiceOverlay();
    }
  };

  try {
    recognition.start();
    setVoiceStatus('listening');
  } catch (error) {
    console.error('Failed to start SpeechRecognition:', error);
    addMessage('Systeem', 'Kon spraakherkenning niet starten.', 'system');
    closeVoiceOverlay();
  }
}

async function handleUserSpeech(transcript: string): Promise<void> {
  if (!state.voiceOverlayActive || state.voiceStatus === 'processing') return;

  setVoiceStatus('processing');

  // Stop recognition during processing to avoid picking up TTS audio
  shouldRestartRecognition = false;
  if (recognition) {
    recognition.onend = null;
    recognition.abort();
    recognition = null;
  }

  addMessage('Jij (Student)', transcript, 'student');
  state.conversationHistory.push({ role: 'user', content: transcript });
  updateChatSessionMeta();

  if (!(await ensureSystemPromptLoaded())) {
    addMessage('Systeem', 'Fout: Kon de systeem-prompt niet laden.', 'system');
    restartListening();
    return;
  }

  const systemPrompt = buildDynamicSystemPrompt();
  const personaName = state.currentScenario?.persona.name || (state.isCollegaMode ? 'Collega' : 'Client');

  addTypingIndicator(personaName, 'patient');

  if (state.voiceStreamController) state.voiceStreamController.abort();
  state.voiceStreamController = new AbortController();

  let sentenceBuffer = '';
  let fullResponseText = '';

  try {
    fullResponseText = await streamChatMessage(
      systemPrompt,
      state.conversationHistory,
      (delta: string) => {
        if (!state.voiceOverlayActive) return;

        sentenceBuffer += delta;

        const sentences = splitSentences(sentenceBuffer);
        if (sentences.completed.length > 0) {
          for (const sentence of sentences.completed) {
            enqueueTTS(sentence);
          }
          sentenceBuffer = sentences.remaining;
        }
      },
      state.voiceStreamController.signal
    );

    if (sentenceBuffer.trim() && state.voiceOverlayActive) {
      enqueueTTS(sentenceBuffer.trim());
      sentenceBuffer = '';
    }

    removeTypingIndicators();

    if (state.voiceOverlayActive && fullResponseText) {
      state.conversationHistory.push({ role: 'assistant', content: fullResponseText });
      addMessage(personaName, fullResponseText, 'patient');
      updateChatSessionMeta();

      const transcriptEl = overlayEl?.querySelector('.voice-transcript') as HTMLElement;
      if (transcriptEl) {
        transcriptEl.textContent =
          fullResponseText.length > 200 ? fullResponseText.substring(0, 200) + '...' : fullResponseText;
        transcriptEl.classList.remove('interim');
      }
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') return;
    console.error('Voice stream error:', error);
    removeTypingIndicators();
    addMessage('Systeem', 'Er ging iets mis. Probeer het opnieuw.', 'system');
    restartListening();
  } finally {
    state.voiceStreamController = null;
  }

  await waitForTTSQueueEmpty();

  if (state.voiceOverlayActive) {
    restartListening();
  }
}

function splitSentences(text: string): { completed: string[]; remaining: string } {
  const completed: string[] = [];

  // Match sentences ending with . ! ? followed by space or end, or *non-verbal*
  const sentenceEndRegex = /([.!?])\s+/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = sentenceEndRegex.exec(text)) !== null) {
    const sentence = text.substring(lastIndex, match.index + 1).trim();
    if (sentence) {
      completed.push(sentence);
    }
    lastIndex = match.index + match[0].length;
  }

  return {
    completed,
    remaining: text.substring(lastIndex)
  };
}

function enqueueTTS(sentence: string): void {
  ttsQueue.push(sentence);

  prefetchTTSAudio(sentence);

  if (!isPlayingTTS) {
    processNextTTS();
  }
}

async function prefetchTTSAudio(sentence: string): Promise<void> {
  if (prefetchedAudio.has(sentence)) return;
  try {
    const audioBlob = await textToSpeech(sentence);
    prefetchedAudio.set(sentence, audioBlob);
  } catch (error) {
    console.error('TTS prefetch error:', error);
  }
}

async function processNextTTS(): Promise<void> {
  if (ttsQueue.length === 0) {
    isPlayingTTS = false;
    return;
  }

  isPlayingTTS = true;
  const sentence = ttsQueue.shift()!;

  if (!state.voiceOverlayActive) {
    isPlayingTTS = false;
    ttsQueue = [];
    prefetchedAudio.clear();
    return;
  }

  setVoiceStatus('speaking');

  let audioBlob = prefetchedAudio.get(sentence);
  if (!audioBlob) {
    try {
      audioBlob = await textToSpeech(sentence);
    } catch (error) {
      console.error('TTS error:', error);
      processNextTTS();
      return;
    }
  }
  prefetchedAudio.delete(sentence);

  if (ttsQueue.length > 0 && !prefetchedAudio.has(ttsQueue[0])) {
    prefetchTTSAudio(ttsQueue[0]);
  }

  let audioUrl: string | null = null;
  try {
    audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    state.currentVoiceAudio = audio;

    await new Promise<void>((resolve) => {
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      audio.play().catch(() => resolve());
    });
  } finally {
    state.currentVoiceAudio = null;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }

  processNextTTS();
}

function stopCurrentAudio(): void {
  if (state.currentVoiceAudio) {
    state.currentVoiceAudio.pause();
    state.currentVoiceAudio.currentTime = 0;
    state.currentVoiceAudio = null;
  }
}

function handleBargeIn(): void {
  stopCurrentAudio();

  ttsQueue = [];
  isPlayingTTS = false;
  prefetchedAudio.clear();

  if (state.voiceStreamController) {
    state.voiceStreamController.abort();
    state.voiceStreamController = null;
  }

  setVoiceStatus('listening');
}

function restartListening(): void {
  if (!state.voiceOverlayActive) return;
  setVoiceStatus('listening');
  startRecognition();
}

function waitForTTSQueueEmpty(): Promise<void> {
  return new Promise((resolve) => {
    function check() {
      if (!isPlayingTTS || !state.voiceOverlayActive) {
        resolve();
      } else {
        setTimeout(check, 100);
      }
    }
    check();
  });
}
