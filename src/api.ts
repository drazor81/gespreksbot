export const API_BASE = import.meta.env.VITE_API_BASE || '';
export const API_URL = `${API_BASE}/api/chat`;

export async function sendChatMessage(
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  signal?: AbortSignal
): Promise<{ response?: string; error?: string }> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({ systemPrompt, messages })
  });

  if (!res.ok) {
    throw new Error(`Server error: ${res.status}`);
  }

  return res.json();
}

export async function speechToText(audioBlob: Blob): Promise<{ transcript?: string; error?: string }> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');

  const res = await fetch(`${API_BASE}/api/speech-to-text`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    throw new Error(`STT error: ${res.status}`);
  }

  return res.json();
}

export async function textToSpeech(text: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}/api/text-to-speech`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });

  if (!res.ok) {
    throw new Error(`TTS error: ${res.status}`);
  }

  return res.blob();
}
