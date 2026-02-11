import type { Scenario, ScoreStats, SelectedSettings } from './types';
import { SETTINGS_OPTIONS } from './config';

export interface AppState {
  conversationHistory: { role: 'user' | 'assistant'; content: string }[];
  speechMode: boolean;
  mediaRecorder: MediaRecorder | null;
  audioChunks: Blob[];
  isRecording: boolean;
  audioContext: AudioContext | null;
  silenceTimer: number | null;
  liveConversationActive: boolean;
  micStream: MediaStream | null;
  currentScenario: Scenario | null;
  isWaitingForResponse: boolean;
  selfAssessment: Record<string, string>;
  conversationStartedAt: Date | null;
  conversationClosed: boolean;
  latestFeedbackScores: ScoreStats | null;
  dashboardSavedForConversation: boolean;
  cachedSystemPrompt: string | null;
  currentRequestController: AbortController | null;
  selectedSettings: SelectedSettings;
  emptyTranscriptCount: number;
  isCollegaMode: boolean;
  currentArchetypeBeschrijving: string;
}

function createInitialState(): AppState {
  return {
    conversationHistory: [],
    speechMode: false,
    mediaRecorder: null,
    audioChunks: [],
    isRecording: false,
    audioContext: null,
    silenceTimer: null,
    liveConversationActive: false,
    micStream: null,
    currentScenario: null,
    isWaitingForResponse: false,
    selfAssessment: {},
    conversationStartedAt: null,
    conversationClosed: false,
    latestFeedbackScores: null,
    dashboardSavedForConversation: false,
    cachedSystemPrompt: null,
    currentRequestController: null,
    selectedSettings: {
      setting: SETTINGS_OPTIONS.setting[0],
      scenarioType: SETTINGS_OPTIONS.scenarioType[0].value,
      leerdoelen: [SETTINGS_OPTIONS.leerdoelen[0]],
      moeilijkheid: SETTINGS_OPTIONS.moeilijkheid[1],
      archetype: SETTINGS_OPTIONS.clientArchetype[0],
      customScenario: '',
      customArchetype: ''
    },
    emptyTranscriptCount: 0,
    isCollegaMode: false,
    currentArchetypeBeschrijving: ''
  };
}

export const state: AppState = createInitialState();

export function getState(): AppState {
  return state;
}

export function setState(updates: Partial<AppState>): void {
  Object.assign(state, updates);
}
