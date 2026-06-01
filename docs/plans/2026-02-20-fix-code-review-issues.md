# Fix Code Review Issues Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all Critical and Important issues identified in the code review of the `7f0a5a7` commit.

**Architecture:** All fixes are in existing source files — no new files needed. Each fix is self-contained and touches a single concern. We work from Critical → Important, committing after each task. No test framework is being introduced (the project has none and adding one is out of scope per the plan).

**Tech Stack:** TypeScript, Vite, vanilla DOM APIs, no test runner.

---

## Task 1: Fix `innerHTML` XSS pattern in `ui.ts` (Critical)

**Files:**
- Modify: `src/ui.ts:864`

**Context:**
`descriptionBox.innerHTML = \`<strong>${scenario.name}</strong>${scenario.description}\`;`
This assigns raw user-controlled-looking strings via `innerHTML`. Even though the data currently comes from a static JSON file bundled at build time, this pattern is architecturally unsafe and inconsistent with the rest of the codebase which uses `escapeHtml()` and `.textContent`. Replace with DOM API approach.

**Step 1: Locate the exact lines**

Read `src/ui.ts` around line 860–866. The code is inside the `scenarioSelect.addEventListener('change', ...)` callback.

**Step 2: Replace `innerHTML` string interpolation with safe DOM construction**

In `src/ui.ts`, replace:
```typescript
    descriptionBox.style.display = 'block';
    descriptionBox.innerHTML = `<strong>${scenario.name}</strong>${scenario.description}`;
```
With:
```typescript
    descriptionBox.style.display = 'block';
    descriptionBox.innerHTML = '';
    const nameEl = document.createElement('strong');
    nameEl.textContent = scenario.name;
    const descEl = document.createElement('span');
    descEl.textContent = scenario.description;
    descriptionBox.appendChild(nameEl);
    descriptionBox.appendChild(descEl);
```

**Step 3: Verify TypeScript compiles**

Run: `npm run build`
Expected: Exits with 0 errors. The `dist/` folder is updated.

**Step 4: Commit**

```bash
git add src/ui.ts
git commit -m "fix: replace innerHTML string interpolation with safe DOM construction in scenario description"
```

---

## Task 2: Fix overlay double-removal race condition in `voice.ts` (Critical)

**Files:**
- Modify: `src/voice.ts:157-168`

**Context:**
`closeVoiceOverlay()` removes the overlay via both a `transitionend` listener and a 400ms `setTimeout` fallback. If `closeVoiceOverlay()` is called twice before the timeout fires, the stale timeout's `overlayEl?.remove()` will remove the newly created overlay.

The fix is to capture the element reference in a local variable before nulling the module-level `overlayEl`, so the timeout closure holds a reference to the old element only.

**Step 1: Locate the exact block in `voice.ts`**

The block is inside `closeVoiceOverlay()`, starting at `if (overlayEl) {` around line 157.

**Step 2: Replace the cleanup block**

Replace:
```typescript
  if (overlayEl) {
    overlayEl.classList.remove('active');
    overlayEl.addEventListener('transitionend', () => {
      overlayEl?.remove();
      overlayEl = null;
    }, { once: true });
    // Fallback if transitionend does not fire
    setTimeout(() => {
      overlayEl?.remove();
      overlayEl = null;
    }, 400);
  }
```
With:
```typescript
  if (overlayEl) {
    overlayEl.classList.remove('active');
    const elToRemove = overlayEl;
    overlayEl = null;
    elToRemove.addEventListener('transitionend', () => {
      elToRemove.remove();
    }, { once: true });
    // Fallback if transitionend does not fire
    setTimeout(() => {
      elToRemove.remove();
    }, 400);
  }
```

**Step 3: Verify TypeScript compiles**

Run: `npm run build`
Expected: 0 errors.

**Step 4: Commit**

```bash
git add src/voice.ts
git commit -m "fix: capture overlay element reference before nulling to prevent double-removal race condition"
```

---

## Task 3: Fix hardcoded MIME type with no browser fallback in `speech.ts` (Important)

**Files:**
- Modify: `src/speech.ts:87`

**Context:**
`new MediaRecorder(state.micStream, { mimeType: 'audio/webm;codecs=opus' })` throws an uncaught `DOMException` on Safari and some Firefox versions. There is no try/catch around this constructor call. The fix is to check `MediaRecorder.isTypeSupported()` and fall back to the browser's default MIME type (by omitting the option) if not supported.

**Step 1: Locate the line in `speech.ts`**

Line 87 inside `startListeningCycle()`:
```typescript
  state.mediaRecorder = new MediaRecorder(state.micStream, { mimeType: 'audio/webm;codecs=opus' });
```

**Step 2: Replace with MIME type detection**

Replace line 87:
```typescript
  state.mediaRecorder = new MediaRecorder(state.micStream, { mimeType: 'audio/webm;codecs=opus' });
```
With:
```typescript
  const preferredMime = 'audio/webm;codecs=opus';
  const recorderOptions = MediaRecorder.isTypeSupported(preferredMime)
    ? { mimeType: preferredMime }
    : {};
  state.mediaRecorder = new MediaRecorder(state.micStream, recorderOptions);
```

Also update line 95 where the same MIME type string is hardcoded for the output Blob:
```typescript
    const audioBlob = new Blob(state.audioChunks, { type: 'audio/webm;codecs=opus' });
```
Replace with:
```typescript
    const blobType = state.mediaRecorder?.mimeType || 'audio/webm';
    const audioBlob = new Blob(state.audioChunks, { type: blobType });
```

**Step 3: Verify TypeScript compiles**

Run: `npm run build`
Expected: 0 errors.

**Step 4: Commit**

```bash
git add src/speech.ts
git commit -m "fix: check MediaRecorder.isTypeSupported before using opus MIME type for Safari/Firefox compat"
```

---

## Task 4: Harden `showTheory()` XSS sanitisation in `ui.ts` (Important)

**Files:**
- Modify: `src/ui.ts:493-509`

**Context:**
`showTheory()` converts markdown-like theory text to HTML via regex, then runs a naive sanitiser that only strips `<script>` tags and `on*="..."` attributes. This misses `javascript:` URIs, unquoted event handlers, and SVG payloads. The data comes from static JSON bundled at build time — but the sanitisation pattern is wrong and would be dangerous if the data source ever changed.

The correct fix (without introducing a third-party library) is to:
1. Add a comment documenting that this function must only receive static build-time content.
2. Expand the sanitiser to also strip `javascript:` URIs from `href`/`src`/`action` attributes.

> **Note:** A production-grade fix would use DOMPurify. That is not introduced here to avoid a new dependency. The expanded regex below is not a complete XSS allowlist — it is documented as a best-effort defence for static content.

**Step 1: Locate `showTheory()` in `ui.ts` around line 493**

**Step 2: Replace the sanitisation block**

Replace:
```typescript
  const sanitized = htmlContent
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  content.innerHTML = sanitized;
```
With:
```typescript
  // IMPORTANT: This function must only ever receive static build-time content from
  // the knowledge JSON files. If the data source becomes dynamic, replace this
  // sanitiser with DOMPurify or an equivalent allowlist sanitiser.
  const sanitized = htmlContent
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')
    .replace(/(href|src|action)\s*=\s*["']?\s*javascript:[^"'\s>]*/gi, '$1="#"');
  content.innerHTML = sanitized;
```

**Step 3: Verify TypeScript compiles**

Run: `npm run build`
Expected: 0 errors.

**Step 4: Commit**

```bash
git add src/ui.ts
git commit -m "fix: expand showTheory sanitiser to strip javascript: URIs and unquoted event handlers; add safety comment"
```

---

## Task 5: Restore critical business-logic comment in `knowledge/index.ts` (Important)

**Files:**
- Modify: `src/knowledge/index.ts:57-59`

**Context:**
The "code simplefyer" commit removed the comment explaining the non-obvious business rule: when "Vrije oefening" is the only leerdoel selected, LSD is given as the base technique. Without this comment a future developer cannot understand the conditional from code alone.

**Step 1: Locate `getKennisVoorLeerdoelen` in `src/knowledge/index.ts` around line 54**

```typescript
export function getKennisVoorLeerdoelen(leerdoelen: string[]): Kennisitem[] {
  const specifiek = leerdoelen.filter((ld) => ld !== 'Vrije oefening' && kennisbank[ld]).map((ld) => kennisbank[ld]);

  if (specifiek.length === 0 && leerdoelen.includes('Vrije oefening')) {
    return [kennisbank['LSD']];
  }

  return specifiek;
}
```

**Step 2: Add the explanatory comment**

Replace:
```typescript
  if (specifiek.length === 0 && leerdoelen.includes('Vrije oefening')) {
    return [kennisbank['LSD']];
  }
```
With:
```typescript
  // Bij alleen "Vrije oefening": geef LSD als basistechniek mee zodat de coach
  // en de client altijd minimaal één gesprekstechniek als referentie hebben.
  if (specifiek.length === 0 && leerdoelen.includes('Vrije oefening')) {
    return [kennisbank['LSD']];
  }
```

**Step 3: Verify TypeScript compiles**

Run: `npm run build`
Expected: 0 errors.

**Step 4: Commit**

```bash
git add src/knowledge/index.ts
git commit -m "docs: restore business-logic comment explaining LSD fallback for Vrije oefening"
```

---

## Task 6: Fix `updateStartButtonState()` to use native `disabled` attribute (Important)

**Files:**
- Modify: `src/ui.ts:598-604`

**Context:**
The start button is visually disabled via a `.btn-disabled` CSS class but remains keyboard-focusable and activatable by assistive technology. The native `button.disabled = true` attribute prevents activation via Enter/Space and is announced correctly by screen readers.

**Step 1: Locate `updateStartButtonState()` in `ui.ts` around line 584**

**Step 2: Replace class toggle with native disabled**

Replace:
```typescript
  if (startBtn) {
    if (checked.length === 0) {
      startBtn.classList.add('btn-disabled');
    } else {
      startBtn.classList.remove('btn-disabled');
    }
  }
```
With:
```typescript
  if (startBtn) {
    startBtn.disabled = checked.length === 0;
    startBtn.classList.toggle('btn-disabled', checked.length === 0);
  }
```

> **Note:** We keep the `btn-disabled` class toggle alongside `disabled` so existing CSS styles continue to apply. The `disabled` attribute now provides the actual interaction barrier.

**Step 3: Check that the `#start-btn` click handler handles the disabled state**

In `initUI()` around line 822:
```typescript
  document.querySelector('#start-btn')?.addEventListener('click', () => {
    const checkboxes = document.querySelectorAll('input[name="leerdoel"]:checked');
    if (checkboxes.length === 0) {
      setInlineError('setup-error', 'Selecteer minimaal 1 leerdoel (of kies "Vrije oefening").');
      return;
    }
```
This guard remains correct. A disabled button won't fire click events from keyboard, but the guard is still valid for programmatic calls.

**Step 4: Verify TypeScript compiles**

Run: `npm run build`
Expected: 0 errors.

**Step 5: Commit**

```bash
git add src/ui.ts
git commit -m "fix: use native button.disabled attribute in updateStartButtonState for keyboard and screen reader accessibility"
```

---

## Task 7: Narrow `STATUS_LABELS` type in `speech.ts` (Minor)

**Files:**
- Modify: `src/speech.ts:7`

**Context:**
`Record<string, string>` allows any string key without a compile-time error. Narrowing to the three actual status values catches future mistakes.

**Step 1: Locate `STATUS_LABELS` at the top of `speech.ts`**

**Step 2: Replace the type annotation**

Replace:
```typescript
const STATUS_LABELS: Record<string, string> = {
```
With:
```typescript
const STATUS_LABELS: Record<'listening' | 'processing' | 'speaking', string> = {
```

**Step 3: Verify TypeScript compiles**

Run: `npm run build`
Expected: 0 errors.

**Step 4: Commit**

```bash
git add src/speech.ts
git commit -m "fix: narrow STATUS_LABELS type to union of valid status keys"
```

---

## Task 8: Document `wireModalCloseOnOverlayClick` single-call contract (Minor)

**Files:**
- Modify: `src/ui.ts:37-41`

**Context:**
The function is called once per modal during `initUI()`. If called twice for the same modal, duplicate event listeners accumulate. The function name does not communicate this. Add a JSDoc comment to document the intended usage.

**Step 1: Locate `wireModalCloseOnOverlayClick` in `ui.ts` around line 37**

**Step 2: Add JSDoc comment**

Replace:
```typescript
function wireModalCloseOnOverlayClick(modalId: string): void {
  document.querySelector(`#${modalId}`)?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).id === modalId) hideModal(modalId);
  });
}
```
With:
```typescript
/**
 * Wires overlay-click-to-close on a modal. Call exactly once per modal during
 * initialisation. Calling multiple times will register duplicate listeners.
 */
function wireModalCloseOnOverlayClick(modalId: string): void {
  document.querySelector(`#${modalId}`)?.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).id === modalId) hideModal(modalId);
  });
}
```

**Step 3: Verify TypeScript compiles**

Run: `npm run build`
Expected: 0 errors.

**Step 4: Commit**

```bash
git add src/ui.ts
git commit -m "docs: document wireModalCloseOnOverlayClick single-call contract"
```

---

## Summary of Issues Addressed

| # | Severity | File | Issue |
|---|----------|------|-------|
| 1 | Critical | `src/ui.ts:864` | `innerHTML` XSS pattern in scenario description |
| 2 | Critical | `src/voice.ts:157-168` | Overlay double-removal race condition |
| 3 | Important | `src/speech.ts:87` | Hardcoded MIME type crashes on Safari/Firefox |
| 4 | Important | `src/ui.ts:505-508` | Inadequate XSS sanitisation in `showTheory()` |
| 5 | Important | `src/knowledge/index.ts:57` | Missing business-logic comment (Vrije oefening → LSD) |
| 6 | Important | `src/ui.ts:598-604` | `btn-disabled` class instead of native `disabled` attribute |
| 7 | Minor | `src/speech.ts:7` | `STATUS_LABELS` typed too broadly |
| 8 | Minor | `src/ui.ts:37` | `wireModalCloseOnOverlayClick` lacks single-call documentation |

**Out of scope (acknowledged but not fixed in this plan):**
- Zero test coverage — requires introducing a test framework (Vitest), which is a separate project decision
- `substring(0, 50)` multi-byte char issue — negligible risk in Dutch-only context
- `splitSentences()` Dutch abbreviation false splits — pre-existing known limitation

