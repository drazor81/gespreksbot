import type { SelectedSettings } from '../../src/types';

export interface SessionState {
  personaName: string;
  currentArchetypeDescription: string;
  isCollegaMode: boolean;
  settings: SelectedSettings;
}

export interface SessionStateStore {
  get(sid: string): SessionState | undefined;
  set(sid: string, state: SessionState): void;
  delete(sid: string): void;
  clear(): void;
}

export function createSessionStateStore(): SessionStateStore {
  const store = new Map<string, SessionState>();

  return {
    get: (sid) => store.get(sid),
    set: (sid, state) => store.set(sid, state),
    delete: (sid) => {
      store.delete(sid);
    },
    clear: () => {
      store.clear();
    }
  };
}

export const sessionStateStore = createSessionStateStore();
