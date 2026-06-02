// Herbruikbare Web Speech API-factory. Bevat de beproefde recognition-mechaniek
// (interim/final-splitsing, auto-restart, error-filtering) zonder kennis van overlay,
// TTS of globale app-state. Zowel de spraak-overlay (voice.ts) als de SOEP-inspreekmodus
// gebruiken deze factory.

interface SpeechRecognitionEventLike extends Event {
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
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
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

export interface SpeechRecognitionHandle {
  start(): void;
  stop(): void;
  abort(): void;
  isActive(): boolean;
}

export interface SpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  /** Herstart automatisch wanneer de herkenning vanzelf stopt (bv. na een stilte). */
  autoRestart?: boolean;
  /** Predicate die de caller levert om de auto-restart te gaten (i.p.v. globale state). */
  shouldRestart?: () => boolean;
  onInterim?: (transcript: string) => void;
  onFinal?: (transcript: string) => void;
  /** Ontvangt de error-string; 'aborted' en 'no-speech' worden al weggefilterd. */
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export function isWebSpeechSupported(): boolean {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

export function createSpeechRecognition(options: SpeechRecognitionOptions = {}): SpeechRecognitionHandle {
  const {
    lang = 'nl-NL',
    continuous = true,
    interimResults = true,
    autoRestart = false,
    shouldRestart,
    onInterim,
    onFinal,
    onError,
    onStart,
    onEnd
  } = options;

  let recognition: SpeechRecognitionInstance | null = null;
  let active = false;

  function build(): SpeechRecognitionInstance {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRecognitionClass();
    rec.continuous = continuous;
    rec.interimResults = interimResults;
    rec.lang = lang;

    rec.onresult = (event: SpeechRecognitionEventLike) => {
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

      if (finalTranscript.trim()) {
        onFinal?.(finalTranscript.trim());
      } else if (interimTranscript) {
        onInterim?.(interimTranscript);
      }
    };

    rec.onend = () => {
      const mayRestart = autoRestart && active && (shouldRestart ? shouldRestart() : true);
      if (mayRestart) {
        try {
          rec.start();
        } catch {
          // Kan falen als de herkenning al loopt; veilig te negeren.
        }
        return;
      }
      onEnd?.();
    };

    rec.onerror = (event: Event & { error: string }) => {
      if (event.error === 'aborted' || event.error === 'no-speech') return;
      onError?.(event.error);
    };

    return rec;
  }

  return {
    start(): void {
      if (active) return;
      active = true;
      recognition = build();
      try {
        recognition.start();
        onStart?.();
      } catch (error) {
        active = false;
        recognition = null;
        onError?.(error instanceof Error ? error.message : 'start-failed');
      }
    },
    stop(): void {
      active = false;
      if (recognition) {
        recognition.onend = null;
        recognition.stop();
        recognition = null;
      }
    },
    abort(): void {
      active = false;
      if (recognition) {
        recognition.onend = null;
        recognition.abort();
        recognition = null;
      }
    },
    isActive(): boolean {
      return active;
    }
  };
}
