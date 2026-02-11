export interface Persona {
  name: string;
  age: number;
  tone: string;
  situation: string;
  background: string;
  emotion: string;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  persona: Persona;
  setting?: string;
  scenarioType?: string;
  archetype?: string;
  moeilijkheid?: string;
  recommendedLeerdoelen?: string[];
}

export interface ScoreStats {
  goed: number;
  voldoende: number;
  onvoldoende: number;
}

export interface DashboardSession {
  id: string;
  dateIso: string;
  studentName: string;
  setting: string;
  scenario: string;
  leerdoelen: string[];
  niveau: string;
  turns: number;
  scores: ScoreStats | null;
}

export interface SelectedSettings {
  setting: string;
  scenarioType: string;
  leerdoelen: string[];
  moeilijkheid: string;
  archetype: string;
  customScenario: string;
  customArchetype: string;
}
