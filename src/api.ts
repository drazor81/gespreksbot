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

export async function streamChatMessage(
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  onDelta: (text: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const res = await fetch(`${API_BASE}/api/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({ systemPrompt, messages })
  });

  if (!res.ok) {
    throw new Error(`Server error: ${res.status}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const jsonStr = line.slice(6).trim();
      if (!jsonStr) continue;

      try {
        const data = JSON.parse(jsonStr) as { delta?: string; done?: boolean; fullText?: string; error?: string };
        if (data.error) throw new Error(data.error);
        if (data.delta) {
          fullText += data.delta;
          onDelta(data.delta);
        }
        if (data.done && data.fullText) {
          fullText = data.fullText;
        }
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
  }

  return fullText;
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
