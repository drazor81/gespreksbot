import type { PublicSoepCasus, SoepCategorie } from '../shared/soep-contract';
import { SOEP_SETTINGS_OPTIES, type SoepSetting } from '../shared/soep-settings';

// Aparte, mutabele state voor de SOEP-rapportagemodus. Bewust losgekoppeld van
// AppState (state.ts) zodat de twee oefenflows elkaar niet beïnvloeden.

export type SoepNiveau = 1 | 2 | 3 | 4;

export interface SoepState {
  casussen: PublicSoepCasus[];
  casussenGeladen: boolean;
  actieveCasusId: string | null;
  niveau: SoepNiveau;
  /** Niveau 1: itemId -> door de student gekozen categorie. */
  ordening: Record<string, SoepCategorie>;
  /** Niveau 2: onderdeel -> ingesproken/bewerkte tekst. */
  onderdeelTeksten: Record<SoepCategorie, string>;
  /** Niveau 3/4: het volledige ingesproken/bewerkte transcript. */
  transcript: string;
  /** Niveau 4: gekozen werkveld + lengte voor de casusgenerator. */
  genereerSetting: SoepSetting;
  genereerLengte: 'kort' | 'uitgebreid';
  /** casusId -> versleuteld ticket; alleen voor gegenereerde casussen. */
  casusTickets: Record<string, string>;
  gegenereerdTeller: number;
  gegenereerdeIds: Set<string>;
  bezig: boolean;
}

const soepState: SoepState = {
  casussen: [],
  casussenGeladen: false,
  actieveCasusId: null,
  niveau: 1,
  ordening: {},
  onderdeelTeksten: { S: '', O: '', E: '', P: '' },
  transcript: '',
  genereerSetting: SOEP_SETTINGS_OPTIES[0],
  genereerLengte: 'kort',
  casusTickets: {},
  gegenereerdTeller: 0,
  gegenereerdeIds: new Set(),
  bezig: false
};

export function getSoepState(): SoepState {
  return soepState;
}

export function getActieveCasus(): PublicSoepCasus | null {
  return soepState.casussen.find((casus) => casus.id === soepState.actieveCasusId) ?? null;
}

/** Of een casus-id bij een (in deze sessie) gegenereerde casus hoort. */
export function isGegenereerd(id: string | null): boolean {
  return id !== null && soepState.gegenereerdeIds.has(id);
}

/** Wist de antwoorden van de huidige oefenronde (casuskeuze/niveau blijven staan). */
export function resetSoepOefening(): void {
  soepState.ordening = {};
  soepState.onderdeelTeksten = { S: '', O: '', E: '', P: '' };
  soepState.transcript = '';
  soepState.bezig = false;
}
