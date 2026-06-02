import { renderFeedbackSafe } from '../security/render-feedback';
import { createSpeechRecognition, isWebSpeechSupported, type SpeechRecognitionHandle } from '../speech-recognition';
import type { PublicSoepCasus, SoepCategorie } from '../shared/soep-contract';
import { SOEP_SETTINGS_OPTIES, type SoepSetting } from '../shared/soep-settings';
import { isGegenereerd, type SoepNiveau, type SoepState } from './soep-state';

// Veilige DOM-rendering voor de SOEP-modus: casustekst en transcript via textContent/
// <textarea>.value (nooit innerHTML); feedback via de bestaande renderFeedbackSafe.

export const SOEP_CATEGORIES: { key: SoepCategorie; label: string; kort: string }[] = [
  { key: 'S', label: 'Subjectief', kort: 'S' },
  { key: 'O', label: 'Objectief', kort: 'O' },
  { key: 'E', label: 'Evaluatie', kort: 'E' },
  { key: 'P', label: 'Plan', kort: 'P' }
];

const NIVEAU_LABELS: Record<SoepNiveau, string> = {
  1: '1 · Ordenen',
  2: '2 · Per onderdeel',
  3: '3 · Voorbeeldtaal',
  4: '4 · Volledig inspreken'
};

type ElProps = {
  class?: string;
  type?: 'button' | 'submit' | 'reset';
  placeholder?: string;
  title?: string;
  disabled?: boolean;
};

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: ElProps = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (props.class) node.className = props.class;
  if (props.type && node instanceof HTMLButtonElement) node.type = props.type;
  if (props.placeholder && node instanceof HTMLTextAreaElement) node.placeholder = props.placeholder;
  if (props.title) node.title = props.title;
  if (props.disabled !== undefined && 'disabled' in node) (node as HTMLButtonElement).disabled = props.disabled;
  for (const child of children) {
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

export interface SoepUiHandlers {
  onTerug(): void;
  onKiesCasus(casusId: string): void;
  onKiesNiveau(niveau: SoepNiveau): void;
  onControleerOrdening(): void;
  onVerstuur(): void;
  onOpnieuw(): void;
  onVolgende(): void;
  onGenereer(setting: SoepSetting, lengte: 'kort' | 'uitgebreid'): void;
}

// --- Herbruikbare inspreekcomponent (mic + live transcript + bewerkbare textarea) ---

export interface InspreekVeld {
  element: HTMLElement;
  getTekst(): string;
  stop(): void;
}

export function maakInspreekVeld(opts: {
  label?: string;
  initieel?: string;
  onChange: (tekst: string) => void;
}): InspreekVeld {
  const ondersteund = isWebSpeechSupported();
  const wrap = el('div', { class: 'soep-inspreek' });

  if (opts.label) {
    wrap.appendChild(el('div', { class: 'soep-inspreek-label' }, opts.label));
  }

  const textarea = el('textarea', {
    class: 'soep-textarea',
    placeholder: ondersteund
      ? 'Spreek in of typ je tekst…'
      : 'Spraak niet beschikbaar in deze browser — typ je tekst hier.'
  });
  textarea.value = opts.initieel ?? '';
  textarea.addEventListener('input', () => opts.onChange(textarea.value));

  let handle: SpeechRecognitionHandle | null = null;
  let opnemen = false;
  let basis = '';

  const micBtn = el('button', { class: 'soep-mic-btn', type: 'button' }, '🎙️ Inspreken');
  const status = el('span', { class: 'soep-mic-status' });

  function stopOpname(): void {
    opnemen = false;
    handle?.stop();
    handle = null;
    micBtn.textContent = '🎙️ Inspreken';
    micBtn.classList.remove('opnemen');
    status.textContent = '';
  }

  function startOpname(): void {
    basis = textarea.value ? textarea.value.trimEnd() + ' ' : '';
    handle = createSpeechRecognition({
      lang: 'nl-NL',
      continuous: true,
      interimResults: true,
      autoRestart: true,
      shouldRestart: () => opnemen,
      onInterim: (t) => {
        textarea.value = basis + t;
        status.textContent = 'Luistert…';
      },
      onFinal: (t) => {
        basis = (basis + t).trimEnd() + ' ';
        textarea.value = basis;
        opts.onChange(textarea.value);
      },
      onError: (error) => {
        status.textContent = error === 'not-allowed' ? 'Microfoon geweigerd' : 'Spraakfout';
        stopOpname();
      }
    });
    opnemen = true;
    micBtn.textContent = '⏹ Stop';
    micBtn.classList.add('opnemen');
    status.textContent = 'Luistert…';
    handle.start();
  }

  if (ondersteund) {
    micBtn.addEventListener('click', () => (opnemen ? stopOpname() : startOpname()));
    const balk = el('div', { class: 'soep-inspreek-balk' }, micBtn, status);
    wrap.appendChild(balk);
  } else {
    wrap.appendChild(
      el('div', { class: 'soep-inspreek-hint' }, 'Tip: gebruik Chrome of Edge om in te spreken. Typen kan altijd.')
    );
  }

  wrap.appendChild(textarea);

  return {
    element: wrap,
    getTekst: () => textarea.value.trim(),
    stop: stopOpname
  };
}

// --- Orden-component (niveau 1): elke uitspraak krijgt S/O/E/P-keuzeknoppen ---

export function maakOrdenComponent(
  casus: PublicSoepCasus,
  ordening: Record<string, SoepCategorie>,
  onKies: (itemId: string, categorie: SoepCategorie) => void
): HTMLElement {
  const wrap = el('div', { class: 'soep-orden' });
  wrap.appendChild(
    el('p', { class: 'soep-orden-uitleg' }, 'Plaats elke uitspraak onder Subjectief, Objectief, Evaluatie of Plan.')
  );

  const items = shuffle(casus.ordenItems);
  for (const item of items) {
    const rij = el('div', { class: 'soep-orden-rij' });
    rij.appendChild(el('div', { class: 'soep-orden-tekst' }, item.tekst));

    const keuzes = el('div', { class: 'soep-orden-keuzes' });
    for (const cat of SOEP_CATEGORIES) {
      const btn = el('button', { class: 'soep-cat-btn', type: 'button', title: cat.label }, cat.kort);
      if (ordening[item.id] === cat.key) btn.classList.add('gekozen');
      btn.addEventListener('click', () => {
        onKies(item.id, cat.key);
        keuzes.querySelectorAll('.soep-cat-btn').forEach((b) => b.classList.remove('gekozen'));
        btn.classList.add('gekozen');
      });
      keuzes.appendChild(btn);
    }
    rij.appendChild(keuzes);
    wrap.appendChild(rij);
  }

  return wrap;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// --- Statische schermstructuur (eenmalig) ---

export interface SoepSchermRefs {
  casusKnoppen: HTMLElement;
  niveauKnoppen: HTMLElement;
  genereerPaneel: HTMLElement;
  casusKaart: HTMLElement;
  oefengebied: HTMLElement;
  actieBalk: HTMLElement;
  feedback: HTMLElement;
}

export function mountSoepScherm(root: HTMLElement, handlers: SoepUiHandlers): SoepSchermRefs {
  root.replaceChildren();

  const kop = el('div', { class: 'soep-kop' });
  const terug = el('button', { class: 'soep-terug-btn', type: 'button' }, '← Terug');
  terug.addEventListener('click', () => handlers.onTerug());
  kop.appendChild(terug);
  kop.appendChild(el('h2', { class: 'soep-titel' }, 'Rapporteren oefenen (SOEP)'));
  root.appendChild(kop);

  root.appendChild(
    el(
      'p',
      { class: 'soep-privacy' },
      'Oefenen met fictieve casussen. Spreek geen echte namen of persoonsgegevens in; spraakherkenning loopt via je browser.'
    )
  );

  const casusKnoppen = el('div', { class: 'soep-casus-keuze' });
  const niveauKnoppen = el('div', { class: 'soep-niveau-keuze' });
  root.appendChild(el('div', { class: 'soep-balk' }, casusKnoppen, niveauKnoppen));

  const genereerPaneel = el('div', { class: 'soep-genereer-paneel' });
  root.appendChild(genereerPaneel);

  const casusKaart = el('div', { class: 'soep-casuskaart' });
  const oefengebied = el('div', { class: 'soep-oefengebied' });
  const actieBalk = el('div', { class: 'soep-actiebalk' });
  const feedback = el('div', { class: 'soep-feedback' });
  root.appendChild(casusKaart);
  root.appendChild(oefengebied);
  root.appendChild(actieBalk);
  root.appendChild(feedback);

  return { casusKnoppen, niveauKnoppen, genereerPaneel, casusKaart, oefengebied, actieBalk, feedback };
}

export function renderCasusKnoppen(
  refs: SoepSchermRefs,
  casussen: PublicSoepCasus[],
  actieveCasusId: string | null,
  onKies: (id: string) => void
): void {
  refs.casusKnoppen.replaceChildren(el('span', { class: 'soep-keuze-label' }, 'Casus:'));
  for (const casus of casussen) {
    const label = isGegenereerd(casus.id) ? `✨ ${casus.naam}` : casus.naam;
    const btn = el('button', { class: 'soep-keuze-btn', type: 'button' }, label);
    if (isGegenereerd(casus.id)) btn.classList.add('soep-keuze-btn--ai');
    if (casus.id === actieveCasusId) btn.classList.add('actief');
    btn.addEventListener('click', () => onKies(casus.id));
    refs.casusKnoppen.appendChild(btn);
  }
}

export function renderNiveauKnoppen(
  refs: SoepSchermRefs,
  actiefNiveau: SoepNiveau,
  onKies: (niveau: SoepNiveau) => void
): void {
  refs.niveauKnoppen.replaceChildren(el('span', { class: 'soep-keuze-label' }, 'Niveau:'));
  ([1, 2, 3, 4] as SoepNiveau[]).forEach((niveau) => {
    const btn = el('button', { class: 'soep-keuze-btn', type: 'button' }, NIVEAU_LABELS[niveau]);
    if (niveau === actiefNiveau) btn.classList.add('actief');
    btn.addEventListener('click', () => onKies(niveau));
    refs.niveauKnoppen.appendChild(btn);
  });
}

export function renderCasusKaart(refs: SoepSchermRefs, casus: PublicSoepCasus): void {
  refs.casusKaart.replaceChildren(
    el('div', { class: 'soep-casus-meta' }, `${casus.naam} · ${casus.setting}`),
    el('p', { class: 'soep-casus-tekst' }, casus.casustekst)
  );
}

export function renderFeedback(refs: SoepSchermRefs, tekst: string): void {
  refs.feedback.replaceChildren(el('h3', { class: 'soep-feedback-titel' }, 'Feedback'));
  refs.feedback.appendChild(renderFeedbackSafe(tekst));
  refs.feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

export function clearFeedback(refs: SoepSchermRefs): void {
  refs.feedback.replaceChildren();
}

export function renderActieKnoppen(
  refs: SoepSchermRefs,
  opts: { primair: { label: string; onClick: () => void; disabled?: boolean }; toonVervolg: boolean },
  handlers: SoepUiHandlers
): void {
  refs.actieBalk.replaceChildren();
  const primair = el(
    'button',
    { class: 'soep-primair-btn', type: 'button', disabled: opts.primair.disabled },
    opts.primair.label
  );
  primair.addEventListener('click', () => opts.primair.onClick());
  refs.actieBalk.appendChild(primair);

  if (opts.toonVervolg) {
    const opnieuw = el('button', { class: 'soep-secundair-btn', type: 'button' }, 'Opnieuw proberen');
    opnieuw.addEventListener('click', () => handlers.onOpnieuw());
    const volgende = el('button', { class: 'soep-secundair-btn', type: 'button' }, 'Volgende casus');
    volgende.addEventListener('click', () => handlers.onVolgende());
    refs.actieBalk.appendChild(opnieuw);
    refs.actieBalk.appendChild(volgende);
  }
}

export function setPrimairBezig(refs: SoepSchermRefs, bezig: boolean): void {
  const btn = refs.actieBalk.querySelector('.soep-primair-btn') as HTMLButtonElement | null;
  if (!btn) return;
  if (bezig) {
    if (!btn.dataset.label) btn.dataset.label = btn.textContent ?? '';
    btn.disabled = true;
    btn.textContent = 'Bezig…';
  } else {
    btn.disabled = false;
    if (btn.dataset.label) {
      btn.textContent = btn.dataset.label;
      delete btn.dataset.label;
    }
  }
}

// --- Generatiepaneel (alleen niveau 4): werkveld + lengte + genereerknop ---

export function renderGenereerPaneel(refs: SoepSchermRefs, state: SoepState, handlers: SoepUiHandlers): void {
  const wrap = el('div', { class: 'soep-genereer' });
  wrap.appendChild(el('span', { class: 'soep-keuze-label' }, 'Of genereer:'));

  const select = el('select', { class: 'soep-genereer-setting', title: 'Kies een werkveld' });
  for (const optie of SOEP_SETTINGS_OPTIES) {
    const option = document.createElement('option');
    option.value = optie;
    option.textContent = optie;
    if (optie === state.genereerSetting) option.selected = true;
    select.appendChild(option);
  }
  select.addEventListener('change', () => {
    state.genereerSetting = select.value as SoepSetting;
  });
  wrap.appendChild(select);

  const lengteGroep = el('div', { class: 'soep-lengte-keuze' });
  const lengtes: { key: 'kort' | 'uitgebreid'; label: string }[] = [
    { key: 'kort', label: 'Kort' },
    { key: 'uitgebreid', label: 'Uitgebreid' }
  ];
  for (const lengte of lengtes) {
    const btn = el('button', { class: 'soep-lengte-btn', type: 'button' }, lengte.label);
    if (state.genereerLengte === lengte.key) btn.classList.add('actief');
    btn.addEventListener('click', () => {
      state.genereerLengte = lengte.key;
      lengteGroep.querySelectorAll('.soep-lengte-btn').forEach((b) => b.classList.remove('actief'));
      btn.classList.add('actief');
    });
    lengteGroep.appendChild(btn);
  }
  wrap.appendChild(lengteGroep);

  const genBtn = el(
    'button',
    { class: 'soep-genereer-btn', type: 'button', disabled: state.bezig },
    '✨ Genereer nieuwe casus'
  );
  genBtn.addEventListener('click', () => handlers.onGenereer(state.genereerSetting, state.genereerLengte));
  wrap.appendChild(genBtn);

  refs.genereerPaneel.replaceChildren(wrap);
}

export function clearGenereerPaneel(refs: SoepSchermRefs): void {
  refs.genereerPaneel.replaceChildren();
}

export function setGenereerBezig(refs: SoepSchermRefs, bezig: boolean): void {
  const btn = refs.genereerPaneel.querySelector('.soep-genereer-btn') as HTMLButtonElement | null;
  if (!btn) return;
  if (bezig) {
    if (!btn.dataset.label) btn.dataset.label = btn.textContent ?? '';
    btn.disabled = true;
    btn.textContent = 'Genereren…';
  } else {
    btn.disabled = false;
    if (btn.dataset.label) {
      btn.textContent = btn.dataset.label;
      delete btn.dataset.label;
    }
  }
}
