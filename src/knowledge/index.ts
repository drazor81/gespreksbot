// Kennisbank voor gesprekstechnieken
import lsd from './lsd.json';
import omaAnna from './oma-anna.json';
import nivea from './nivea.json';
import sbar from './sbar.json';
import klinischRedeneren from './klinisch-redeneren.json';
import mgv from './mgv.json';
import vierGModel from './4g-model.json';
import deEscalatie from './de-escalatie.json';
import starr from './starr.json';

export interface Kennisitem {
  id: string;
  naam: string;
  korteUitleg: string;
  uitgebreideTheorie?: string;  // Optioneel veld voor extra theorie
  technieken: Record<string, string>;
  voorbeeldenGoed: string[];
  voorbeeldenFout: string[];
  clientReactie: {
    bijGoed: string;
    bijFout: string;
  };
  coachTips: string[];
}

// Map van leerdoel-ID naar kennisitem
const kennisbank: Record<string, Kennisitem> = {
  'LSD': lsd,
  'OMA/ANNA': omaAnna,
  'NIVEA': nivea,
  'SBAR': sbar,
  'Klinisch Redeneren': klinischRedeneren,
  'MGV': mgv,
  '4G-model': vierGModel,
  'De-escalatie': deEscalatie,
  'STARR': starr,
};

// Haal kennis op voor geselecteerde leerdoelen
export function getKennisVoorLeerdoelen(leerdoelen: string[]): Kennisitem[] {
  return leerdoelen
    .filter(ld => ld !== 'Vrije oefening' && kennisbank[ld])
    .map(ld => kennisbank[ld]);
}

// Genereer instructies voor de cliënt op basis van leerdoelen
export function getClientInstructies(leerdoelen: string[]): string {
  const kennis = getKennisVoorLeerdoelen(leerdoelen);
  if (kennis.length === 0) return '';

  const instructies = kennis.map(k => {
    return `**${k.naam}:**
- Als de student het GOED doet: ${k.clientReactie.bijGoed}
- Als de student het FOUT doet: ${k.clientReactie.bijFout}`;
  }).join('\n\n');

  return `
## Hoe je reageert op de gesprekstechnieken

De student oefent met de volgende technieken. Reageer natuurlijk (als mens, niet als beoordelaar) maar houd hier rekening mee:

${instructies}
`;
}

// Genereer context voor de coach op basis van leerdoelen
export function getCoachContext(leerdoelen: string[]): string {
  const kennis = getKennisVoorLeerdoelen(leerdoelen);
  if (kennis.length === 0) return '';

  const context = kennis.map(k => {
    return `**${k.naam}:**
${k.korteUitleg}

Waar je op let:
${k.coachTips.map(tip => `- ${tip}`).join('\n')}

Voorbeelden van GOED:
${k.voorbeeldenGoed.map(v => `- ${v}`).join('\n')}

Voorbeelden van FOUT:
${k.voorbeeldenFout.map(v => `- ${v}`).join('\n')}`;
  }).join('\n\n---\n\n');

  return context;
}

export default kennisbank;
