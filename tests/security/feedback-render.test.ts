import { describe, expect, it } from 'vitest';
import { renderFeedbackSafe } from '../../src/security/render-feedback';

describe('renderFeedbackSafe', () => {
  it('does not create executable nodes from model output', () => {
    const fragment = renderFeedbackSafe('## Titel\n<img src=x onerror=alert(1)>');
    const container = document.createElement('div');
    container.appendChild(fragment);

    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('<img src=x onerror=alert(1)>');
  });

  it('preserves score cards and semantic text structure using safe DOM nodes', () => {
    const fragment = renderFeedbackSafe(`<!--SCORES\nleerdoel|criterium|score\nLSD|Luisteren|goed\nSCORES-->\n## Sterk\n**Luisteren** ging goed\n- Stel een open vraag`);
    const container = document.createElement('div');
    container.appendChild(fragment);

    expect(container.querySelector('.score-row')).not.toBeNull();
    expect(container.querySelector('h3')?.textContent).toBe('Sterk');
    expect(container.querySelector('strong')?.textContent).toBe('Luisteren');
    expect(container.querySelector('li')?.textContent).toBe('Stel een open vraag');
  });
});
