// Werkvelden voor de SOEP-generator (niveau 4).
// Bewust ZOD-VRIJ en zonder zware imports, zodat zowel het contract (server-validatie)
// als de frontend-UI deze lijst kunnen importeren zónder de zod-schema's mee te bundelen.
// Spiegelt SETTINGS_OPTIONS.setting uit src/config.ts (Title-Case).

export const SOEP_SETTINGS_OPTIES = [
  'Verpleeghuis',
  'Thuiszorg',
  'Ziekenhuis',
  'GGZ',
  'Gehandicaptenzorg',
  'Huisartsenpraktijk'
] as const;

export type SoepSetting = (typeof SOEP_SETTINGS_OPTIES)[number];
