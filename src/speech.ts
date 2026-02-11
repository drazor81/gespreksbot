import { state } from './state';
import { MAX_EMPTY_RETRIES } from './config';
import { speechToText, textToSpeech } from './api';
import { addMessage, addTypingIndicator, updateChatSessionMeta } from './ui';
import { generateResponseAndReturn } from './chat';

export function updateLiveStatus(statusState: 'idle' | 'listening' | 'processing' | 'speaking') {
  const btn = document.querySelector('#live-conv-btn') as HTMLButtonElement;
  const label = btn?.querySelector('.live-conv-label') as HTMLSpanElement;
  const statusEl = document.querySelector('#live-status') as HTMLElement;
  const statusText = statusEl?.querySelector('.live-status-text') as HTMLSpanElement;
  const indicator = statusEl?.querySelector('.live-indicator') as HTMLElement;

  if (!btn || !statusEl) return;

  btn.classList.remove('active');
  statusEl.style.display = 'none';
  indicator?.classList.remove('listening', 'processing', 'speaking');

  switch (statusState) {
    case 'idle':
      if (label) label.textContent = 'Start gesprek';
      break;
    case 'listening':
      btn.classList.add('active');
      if (label) label.textContent = 'Stop gesprek';
      statusEl.style.display = 'flex';
      indicator?.classList.add('listening');
      if (statusText) statusText.textContent = 'Luistert...';
      break;
    case 'processing':
      btn.classList.add('active');
      if (label) label.textContent = 'Stop gesprek';
      statusEl.style.display = 'flex';
      indicator?.classList.add('processing');
      if (statusText) statusText.textContent = 'Verwerkt...';
      break;
    case 'speaking':
      btn.classList.add('active');
      if (label) label.textContent = 'Stop gesprek';
      statusEl.style.display = 'flex';
      indicator?.classList.add('speaking');
      if (statusText) statusText.textContent = 'Spreekt...';
      break;
  }
}

export async function startLiveConversation() {
  try {
    state.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.liveConversationActive = true;
    state.emptyTranscriptCount = 0;
    startListeningCycle();
  } catch {
    if (state.micStream) {
      state.micStream.getTracks().forEach((t) => t.stop());
      state.micStream = null;
    }
    state.liveConversationActive = false;
    addMessage('Systeem', 'Kon microfoon niet openen. Controleer je browserinstellingen.', 'system');
  }
}

export function stopLiveConversation() {
  state.liveConversationActive = false;
  if (state.silenceTimer) {
    clearTimeout(state.silenceTimer);
    state.silenceTimer = null;
  }
  if (state.audioContext) {
    state.audioContext.close();
    state.audioContext = null;
  }
  if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
    state.mediaRecorder.stop();
  }
  state.isRecording = false;
  if (state.micStream) {
    state.micStream.getTracks().forEach((t) => t.stop());
    state.micStream = null;
  }
  updateLiveStatus('idle');
}

function startListeningCycle() {
  if (!state.liveConversationActive || !state.micStream) return;

  state.audioChunks = [];
  state.mediaRecorder = new MediaRecorder(state.micStream, { mimeType: 'audio/webm;codecs=opus' });

  state.mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) state.audioChunks.push(e.data);
  };

  state.mediaRecorder.onstop = () => {
    if (!state.liveConversationActive) return;
    const audioBlob = new Blob(state.audioChunks, { type: 'audio/webm;codecs=opus' });
    handleLiveSpeechInput(audioBlob);
  };

  state.mediaRecorder.start();
  state.isRecording = true;
  updateLiveStatus('listening');
  startSilenceDetection(state.micStream);
}

function stopCurrentRecording() {
  if (state.silenceTimer) {
    clearTimeout(state.silenceTimer);
    state.silenceTimer = null;
  }
  if (state.audioContext) {
    state.audioContext.close();
    state.audioContext = null;
  }
  if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
    state.mediaRecorder.stop();
  }
  state.isRecording = false;
}

function startSilenceDetection(stream: MediaStream) {
  state.audioContext = new AudioContext();
  const source = state.audioContext.createMediaStreamSource(stream);
  const analyser = state.audioContext.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);

  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  let silenceStart: number | null = null;
  const SILENCE_THRESHOLD = 15;
  const SILENCE_DURATION = 1500;

  function checkSilence() {
    if (!state.isRecording || !state.liveConversationActive) {
      if (state.audioContext) {
        state.audioContext.close();
        state.audioContext = null;
      }
      return;
    }

    try {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((sum, v) => sum + v, 0) / dataArray.length;

      if (average < SILENCE_THRESHOLD) {
        if (!silenceStart) silenceStart = Date.now();
        else if (Date.now() - silenceStart > SILENCE_DURATION) {
          stopCurrentRecording();
          return;
        }
      } else {
        silenceStart = null;
      }

      state.silenceTimer = window.setTimeout(checkSilence, 100);
    } catch {
      if (state.audioContext) {
        state.audioContext.close();
        state.audioContext = null;
      }
      stopCurrentRecording();
    }
  }

  state.silenceTimer = window.setTimeout(checkSilence, 1000);
}

async function handleLiveSpeechInput(audioBlob: Blob) {
  if (!state.liveConversationActive) return;

  updateLiveStatus('processing');

  try {
    const sttData = await speechToText(audioBlob);

    if (!state.liveConversationActive) return;

    if (sttData.error) {
      addMessage('Systeem', `Spraakherkenning fout: ${sttData.error}`, 'system');
      if (state.liveConversationActive) startListeningCycle();
      return;
    }

    const transcript = sttData.transcript?.trim();
    if (!transcript) {
      state.emptyTranscriptCount++;
      if (state.emptyTranscriptCount >= MAX_EMPTY_RETRIES) {
        addMessage('Systeem', 'Geen spraak gedetecteerd. Druk opnieuw op de microfoon.', 'system');
        stopLiveConversation();
        return;
      }
      setTimeout(() => {
        if (state.liveConversationActive) startListeningCycle();
      }, state.emptyTranscriptCount * 1000);
      return;
    }
    state.emptyTranscriptCount = 0;

    addMessage('Jij (Student)', transcript, 'student');
    state.conversationHistory.push({ role: 'user', content: transcript });
    updateChatSessionMeta();

    if (!state.liveConversationActive) return;

    addTypingIndicator(state.currentScenario?.persona.name || (state.isCollegaMode ? 'Collega' : 'Client'), 'patient');

    const responseText = await generateResponseAndReturn();

    if (!state.liveConversationActive) return;

    if (responseText && state.liveConversationActive) {
      updateLiveStatus('speaking');
      await speakResponse(responseText);
    }
  } catch {
    if (state.liveConversationActive) {
      addMessage('Systeem', 'Spraakherkenning tijdelijk niet beschikbaar.', 'system');
    }
  }

  if (state.liveConversationActive) {
    startListeningCycle();
  }
}

async function speakResponse(text: string) {
  let audioUrl: string | null = null;
  try {
    const audioBlob = await textToSpeech(text);
    audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    await new Promise<void>((resolve) => {
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      audio.play();
    });
  } catch (error) {
    console.error('TTS playback error:', error);
  } finally {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }
}
