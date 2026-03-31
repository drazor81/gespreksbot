const TURNSTILE_SCRIPT_ID = 'turnstile-api-script';
const TURNSTILE_CONTAINER_ID = 'turnstile-widget-container';
const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

type TurnstileExecutionMode = 'render' | 'execute';
type TurnstileAppearanceMode = 'always' | 'execute' | 'interaction-only';

interface TurnstileRenderOptions {
  sitekey: string;
  theme?: 'auto' | 'light' | 'dark';
  appearance?: TurnstileAppearanceMode;
  execution?: TurnstileExecutionMode;
  callback?: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
  'timeout-callback'?: () => void;
}

interface TurnstileApi {
  render(target: string, options: TurnstileRenderOptions): string;
  execute(target: string): void;
  reset(widgetId: string): void;
}

type TurnstileGlobal = typeof globalThis & {
  turnstile?: TurnstileApi;
};

let scriptPromise: Promise<TurnstileApi> | null = null;
let widgetId: string | null = null;
let currentToken: string | null = null;
let pendingTokenPromise: Promise<string> | null = null;
let pendingTokenResolve: ((token: string) => void) | null = null;
let pendingTokenReject: ((error: Error) => void) | null = null;

function getTurnstileGlobal(): TurnstileGlobal {
  return globalThis as TurnstileGlobal;
}

function getContainerSelector(): string {
  ensureContainer();
  return `#${TURNSTILE_CONTAINER_ID}`;
}

function ensureContainer(): HTMLDivElement {
  let container = document.querySelector<HTMLDivElement>(`#${TURNSTILE_CONTAINER_ID}`);
  if (container) {
    return container;
  }

  container = document.createElement('div');
  container.id = TURNSTILE_CONTAINER_ID;
  container.setAttribute('aria-live', 'polite');
  Object.assign(container.style, {
    position: 'fixed',
    right: '16px',
    bottom: '16px',
    zIndex: '2147483647'
  });

  document.body.appendChild(container);
  return container;
}

function clearPendingTokenState(): void {
  pendingTokenPromise = null;
  pendingTokenResolve = null;
  pendingTokenReject = null;
}

function handleTurnstileToken(token: string): void {
  if (pendingTokenResolve) {
    const resolve = pendingTokenResolve;
    clearPendingTokenState();
    currentToken = null;
    resolve(token);
    return;
  }

  currentToken = token;
}

function handleTurnstileFailure(message: string): void {
  currentToken = null;

  if (pendingTokenReject) {
    const reject = pendingTokenReject;
    clearPendingTokenState();
    reject(new Error(message));
  }
}

async function loadTurnstileApi(): Promise<TurnstileApi> {
  const globalApi = getTurnstileGlobal().turnstile;
  if (globalApi) {
    return globalApi;
  }

  if (!scriptPromise) {
    scriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
      const onLoad = () => {
        const api = getTurnstileGlobal().turnstile;
        if (api) {
          resolve(api);
          return;
        }

        scriptPromise = null;
        reject(new Error('Turnstile script geladen zonder API.'));
      };

      const onError = () => {
        scriptPromise = null;
        reject(new Error('Turnstile script laden mislukt.'));
      };

      const existingScript = document.querySelector<HTMLScriptElement>(`#${TURNSTILE_SCRIPT_ID}`);
      if (existingScript) {
        existingScript.addEventListener('load', onLoad, { once: true });
        existingScript.addEventListener('error', onError, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.id = TURNSTILE_SCRIPT_ID;
      script.src = TURNSTILE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.addEventListener('load', onLoad, { once: true });
      script.addEventListener('error', onError, { once: true });
      document.head.appendChild(script);
    });
  }

  return scriptPromise;
}

async function ensureWidget(siteKey: string): Promise<TurnstileApi> {
  const api = await loadTurnstileApi();
  ensureContainer();

  if (!widgetId) {
    widgetId = api.render(getContainerSelector(), {
      sitekey: siteKey,
      appearance: 'interaction-only',
      execution: 'execute',
      callback: handleTurnstileToken,
      'error-callback': () => {
        handleTurnstileFailure('Beveiligingscheck mislukt. Vernieuw de pagina en probeer opnieuw.');
      },
      'expired-callback': () => {
        currentToken = null;
      },
      'timeout-callback': () => {
        handleTurnstileFailure('Beveiligingscheck duurde te lang. Probeer het opnieuw.');
      }
    });
  }

  return api;
}

export async function initTurnstile(siteKey: string | undefined): Promise<void> {
  if (!siteKey) {
    return;
  }

  try {
    const api = await ensureWidget(siteKey);
    if (!currentToken && !pendingTokenPromise && widgetId) {
      api.reset(widgetId);
      api.execute(getContainerSelector());
    }
  } catch {
    // De sessieflow handelt echte gebruikersfouten later zelf af.
  }
}

export async function getTurnstileChallengeToken(siteKey: string): Promise<string> {
  if (currentToken) {
    const token = currentToken;
    currentToken = null;
    return token;
  }

  if (!pendingTokenPromise) {
    pendingTokenPromise = (async () => {
      const api = await ensureWidget(siteKey);

      return new Promise<string>((resolve, reject) => {
        pendingTokenResolve = resolve;
        pendingTokenReject = reject;

        try {
          if (widgetId) {
            api.reset(widgetId);
          }
          api.execute(getContainerSelector());
        } catch (error) {
          clearPendingTokenState();
          reject(
            error instanceof Error
              ? error
              : new Error('Beveiligingscheck kon niet worden gestart. Probeer het opnieuw.')
          );
        }
      });
    })().finally(() => {
      pendingTokenPromise = null;
    });
  }

  return pendingTokenPromise;
}

export function resetTurnstileForTests(): void {
  currentToken = null;
  clearPendingTokenState();
  widgetId = null;
  scriptPromise = null;
  document.querySelector(`#${TURNSTILE_CONTAINER_ID}`)?.remove();
  document.querySelector(`#${TURNSTILE_SCRIPT_ID}`)?.remove();
}
