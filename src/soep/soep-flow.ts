import { showToast } from '../ui';
import { getSoepKennis } from '../knowledge/index';
import type { SoepSetting } from '../shared/soep-settings';
import { fetchSoepCasussen, genereerSoepCasus, sendSoepModeRequest } from './soep-api';
import { getActieveCasus, getSoepState, isGegenereerd, resetSoepOefening, type SoepNiveau } from './soep-state';
import {
  clearFeedback,
  clearGenereerPaneel,
  maakInspreekVeld,
  maakOrdenComponent,
  mountSoepScherm,
  renderActieKnoppen,
  renderCasusKaart,
  renderCasusKnoppen,
  renderFeedback,
  renderGenereerPaneel,
  renderNiveauKnoppen,
  setGenereerBezig,
  setPrimairBezig,
  SOEP_CATEGORIES,
  type InspreekVeld,
  type SoepSchermRefs,
  type SoepUiHandlers
} from './soep-ui';

let refs: SoepSchermRefs | null = null;
let exitNaarHome: () => void = () => {};
let actieveVelden: InspreekVeld[] = [];

function stopAlleVelden(): void {
  for (const veld of actieveVelden) veld.stop();
  actieveVelden = [];
}

const handlers: SoepUiHandlers = {
  onTerug: () => {
    stopAlleVelden();
    exitNaarHome();
  },
  onKiesCasus: (casusId) => {
    getSoepState().actieveCasusId = casusId;
    stopAlleVelden();
    resetSoepOefening();
    renderAlles();
  },
  onKiesNiveau: (niveau) => {
    const state = getSoepState();
    state.niveau = niveau;
    // Gegenereerde casussen bestaan alleen op niveau 4 (geen ordenItems); val anders terug op een bankcasus.
    if (niveau !== 4 && isGegenereerd(state.actieveCasusId)) {
      const bank = state.casussen.find((casus) => !isGegenereerd(casus.id));
      state.actieveCasusId = bank ? bank.id : null;
      showToast('Gegenereerde casussen oefen je op niveau 4. Teruggezet naar een vaste casus.', 'info');
    }
    stopAlleVelden();
    resetSoepOefening();
    renderAlles();
  },
  onControleerOrdening: () => void controleerOrdening(),
  onVerstuur: () => void verstuurFeedback(),
  onOpnieuw: () => {
    stopAlleVelden();
    resetSoepOefening();
    renderAlles();
  },
  onVolgende: () => {
    const state = getSoepState();
    // Buiten niveau 4 roteren we alleen door de vaste bankcasussen.
    const lijst = state.niveau === 4 ? state.casussen : state.casussen.filter((c) => !isGegenereerd(c.id));
    if (lijst.length === 0) return;
    const idx = lijst.findIndex((c) => c.id === state.actieveCasusId);
    const volgende = lijst[(idx + 1) % lijst.length];
    if (volgende) state.actieveCasusId = volgende.id;
    stopAlleVelden();
    resetSoepOefening();
    renderAlles();
  },
  onGenereer: (setting, lengte) => void genereerCasus(setting, lengte)
};

/** Entry point vanuit het home-scherm. `onExit` brengt de gebruiker terug naar home. */
export async function initSoepFlow(onExit: () => void): Promise<void> {
  exitNaarHome = onExit;
  const root = document.querySelector('#soep-root') as HTMLElement | null;
  if (!root) return;

  refs = mountSoepScherm(root, handlers);

  const state = getSoepState();
  if (!state.casussenGeladen) {
    try {
      state.casussen = await fetchSoepCasussen();
      state.casussenGeladen = true;
    } catch {
      showToast('Kon de casussen niet laden. Probeer het later opnieuw.', 'error');
      return;
    }
  }

  if (!state.actieveCasusId && state.casussen.length > 0) {
    state.actieveCasusId = state.casussen[0].id;
  }

  renderAlles();
}

function renderAlles(): void {
  if (!refs) return;
  const state = getSoepState();
  const casus = getActieveCasus();

  renderCasusKnoppen(refs, state.casussen, state.actieveCasusId, handlers.onKiesCasus);
  renderNiveauKnoppen(refs, state.niveau, handlers.onKiesNiveau);
  if (state.niveau === 4) {
    renderGenereerPaneel(refs, state, handlers);
  } else {
    clearGenereerPaneel(refs);
  }
  clearFeedback(refs);

  if (!casus) {
    refs.casusKaart.replaceChildren();
    refs.oefengebied.replaceChildren();
    refs.actieBalk.replaceChildren();
    return;
  }

  renderCasusKaart(refs, casus);
  renderOefengebied();
}

function renderOefengebied(): void {
  if (!refs) return;
  const state = getSoepState();
  const casus = getActieveCasus();
  if (!casus) return;

  stopAlleVelden();
  refs.oefengebied.replaceChildren();

  if (state.niveau === 1) {
    const component = maakOrdenComponent(casus, state.ordening, (itemId, categorie) => {
      state.ordening[itemId] = categorie;
    });
    refs.oefengebied.appendChild(component);
    renderActieKnoppen(
      refs,
      { primair: { label: 'Controleer indeling', onClick: handlers.onControleerOrdening }, toonVervolg: false },
      handlers
    );
    return;
  }

  if (state.niveau === 2) {
    for (const cat of SOEP_CATEGORIES) {
      const veld = maakInspreekVeld({
        label: `${cat.kort} — ${cat.label}`,
        initieel: state.onderdeelTeksten[cat.key],
        onChange: (tekst) => {
          state.onderdeelTeksten[cat.key] = tekst;
        }
      });
      actieveVelden.push(veld);
      refs.oefengebied.appendChild(veld.element);
    }
    renderActieKnoppen(
      refs,
      { primair: { label: 'Stuur in voor feedback', onClick: handlers.onVerstuur }, toonVervolg: false },
      handlers
    );
    return;
  }

  if (state.niveau === 3) {
    const voorbeelden = getSoepKennis().voorbeeldenGoed;
    const voorbeeld = voorbeelden[Math.floor(Math.random() * voorbeelden.length)] ?? '';
    refs.oefengebied.appendChild(maakVoorbeeldHint(voorbeeld));
  }

  const veld = maakInspreekVeld({
    label: state.niveau === 4 ? 'Spreek de volledige SOEP-rapportage in' : 'Spreek je aangescherpte rapportage in',
    initieel: state.transcript,
    onChange: (tekst) => {
      state.transcript = tekst;
    }
  });
  actieveVelden.push(veld);
  refs.oefengebied.appendChild(veld.element);
  renderActieKnoppen(
    refs,
    { primair: { label: 'Stuur in voor feedback', onClick: handlers.onVerstuur }, toonVervolg: false },
    handlers
  );
}

function maakVoorbeeldHint(voorbeeld: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'soep-voorbeeld';
  const label = document.createElement('strong');
  label.textContent = 'Voorbeeldzin: ';
  const tekst = document.createElement('span');
  tekst.textContent = voorbeeld;
  wrap.appendChild(label);
  wrap.appendChild(tekst);
  return wrap;
}

async function controleerOrdening(): Promise<void> {
  if (!refs) return;
  const state = getSoepState();
  const casus = getActieveCasus();
  if (!casus) return;

  const toewijzingen = Object.entries(state.ordening).map(([itemId, gekozen]) => ({ itemId, gekozen }));
  if (toewijzingen.length < casus.ordenItems.length) {
    showToast('Deel eerst alle uitspraken in onder S, O, E of P.', 'info');
    return;
  }

  await verstuurRequest({ actie: 'ordenen', casusId: casus.id, niveau: 1, toewijzingen });
}

async function verstuurFeedback(): Promise<void> {
  const state = getSoepState();
  const casus = getActieveCasus();
  if (!casus) return;

  stopAlleVelden();
  const niveau = state.niveau as Exclude<SoepNiveau, 1>;
  const transcript = niveau === 2 ? combineerOnderdelen() : state.transcript.trim();

  if (!transcript) {
    showToast('Spreek of typ eerst je rapportage in.', 'info');
    return;
  }

  const ticket = state.casusTickets[casus.id];
  await verstuurRequest(
    ticket
      ? { actie: 'feedback', casusTicket: ticket, niveau, transcript }
      : { actie: 'feedback', casusId: casus.id, niveau, transcript }
  );
}

async function genereerCasus(setting: SoepSetting, lengte: 'kort' | 'uitgebreid'): Promise<void> {
  if (!refs) return;
  const state = getSoepState();
  if (state.bezig) return;

  state.bezig = true;
  setGenereerBezig(refs, true);

  try {
    const data = await genereerSoepCasus({ setting, lengte });
    const id = `gegenereerd-${++state.gegenereerdTeller}`;
    state.casussen.push({ ...data.casus, id });
    state.casusTickets[id] = data.ticket;
    state.gegenereerdeIds.add(id);
    state.actieveCasusId = id;
    resetSoepOefening();
    renderAlles();
    showToast('Nieuwe casus gegenereerd. Veel succes met inspreken!', 'success');
  } catch (error) {
    // De server levert nette NL-foutmeldingen (rate-limit, 502, enz.); toon die direct,
    // met een generieke fallback voor netwerk-/onbekende fouten.
    const bericht = error instanceof Error ? error.message.trim() : '';
    const netteMelding = bericht.length > 0 && !bericht.startsWith('SOEP genereer error') && !/fetch/i.test(bericht);
    showToast(netteMelding ? bericht : 'Genereren mislukt. Probeer het opnieuw.', 'error');
  } finally {
    state.bezig = false;
    if (refs) setGenereerBezig(refs, false);
  }
}

function combineerOnderdelen(): string {
  const state = getSoepState();
  return SOEP_CATEGORIES.map((cat) => ({ cat, tekst: state.onderdeelTeksten[cat.key].trim() }))
    .filter((deel) => deel.tekst.length > 0)
    .map((deel) => `${deel.cat.label}: ${deel.tekst}`)
    .join('\n');
}

async function verstuurRequest(request: Parameters<typeof sendSoepModeRequest>[0]): Promise<void> {
  if (!refs) return;
  const state = getSoepState();
  if (state.bezig) return;

  state.bezig = true;
  setPrimairBezig(refs, true);

  try {
    const data = await sendSoepModeRequest(request);
    if (data.error || !data.response) {
      showToast(data.error || 'Geen feedback ontvangen. Probeer het opnieuw.', 'error');
      return;
    }
    renderFeedback(refs, data.response);
    renderActieKnoppen(
      refs,
      { primair: { label: 'Nieuwe ronde', onClick: handlers.onOpnieuw }, toonVervolg: true },
      handlers
    );
  } catch (error) {
    const bericht = error instanceof Error ? error.message : 'Er ging iets mis.';
    showToast(
      bericht.includes('429')
        ? 'Even rustig aan — te veel verzoeken. Wacht een momentje.'
        : 'Er ging iets mis. Probeer het opnieuw.',
      'error'
    );
  } finally {
    state.bezig = false;
    if (refs) setPrimairBezig(refs, false);
  }
}
