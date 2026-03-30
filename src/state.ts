import type { ConversationMessage, Scenario, ScoreStats, SelectedSettings } from './types';
import { SETTINGS_OPTIONS } from './config';

export interface AppState {
  conversationHistory: ConversationMessage[];
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
  currentRequestController: AbortController | null;
  selectedSettings: SelectedSettings;
  emptyTranscriptCount: number;
  isCollegaMode: boolean;
  currentArchetypeBeschrijving: string;
  sessionToken: string | null;
  sessionTokenExpiresAt: number | null;
  // Voice overlay state
  voiceOverlayActive: boolean;
  voiceStatus: 'idle' | 'listening' | 'processing' | 'speaking';
  currentVoiceAudio: HTMLAudioElement | null;
  voiceStreamController: AbortController | null;
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
    currentArchetypeBeschrijving: '',
    sessionToken: null,
    sessionTokenExpiresAt: null,
    voiceOverlayActive: false,
    voiceStatus: 'idle',
    currentVoiceAudio: null,
    voiceStreamController: null
  };
}

export const state: AppState = createInitialState();

export function getState(): AppState {
  return state;
}

export function setState(updates: Partial<AppState>): void {
  Object.assign(state, updates);
}
