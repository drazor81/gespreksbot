interface ScoreEntry {
  criterium: string;
  score: string;
}

function extractScoreGroups(text: string): {
  grouped: Record<string, ScoreEntry[]>;
  content: string;
} {
  const grouped: Record<string, ScoreEntry[]> = {};
  const scoresMatch = text.match(/<!--SCORES\n([\s\S]*?)SCORES-->/);

  if (!scoresMatch) {
    return { grouped, content: text };
  }

  const lines = scoresMatch[1]
    .trim()
    .split('\n')
    .filter((line) => line.includes('|'));
  const dataLines = lines.filter((line) => !line.startsWith('leerdoel|'));

  for (const line of dataLines) {
    const [leerdoel, criterium, score] = line.split('|').map((value) => value.trim());
    if (!leerdoel || !criterium || !score) continue;
    if (!grouped[leerdoel]) grouped[leerdoel] = [];
    grouped[leerdoel].push({ criterium, score });
  }

  return {
    grouped,
    content: text.replace(/<!--SCORES\n[\s\S]*?SCORES-->\n*/g, '').trim()
  };
}

function appendInlineContent(target: HTMLElement, text: string): void {
  const tokens = text.split(/(\*\*[^*]+\*\*|"[^"\n]+")/g).filter(Boolean);

  for (const token of tokens) {
    if (token.startsWith('**') && token.endsWith('**')) {
      const strong = document.createElement('strong');
      strong.textContent = token.slice(2, -2);
      target.appendChild(strong);
      continue;
    }

    if (token.startsWith('"') && token.endsWith('"')) {
      const quote = document.createElement('q');
      quote.textContent = token.slice(1, -1);
      target.appendChild(quote);
      continue;
    }

    target.appendChild(document.createTextNode(token));
  }
}

function buildScoreTable(grouped: Record<string, ScoreEntry[]>): HTMLElement | null {
  const leerdoelen = Object.entries(grouped);
  if (leerdoelen.length === 0) {
    return null;
  }

  const container = document.createElement('div');
  container.className = 'score-table-container';

  for (const [leerdoel, criteria] of leerdoelen) {
    const label = document.createElement('div');
    label.className = 'score-leerdoel-label';
    label.textContent = leerdoel;
    container.appendChild(label);

    for (const { criterium, score } of criteria) {
      const normalizedScore = score.toLowerCase();
      const scoreClass =
        normalizedScore === 'goed'
          ? 'score-goed'
          : normalizedScore === 'voldoende'
            ? 'score-voldoende'
            : 'score-onvoldoende';

      const row = document.createElement('div');
      row.className = 'score-row';

      const dot = document.createElement('span');
      dot.className = `score-dot ${scoreClass}`;

      const criteriumEl = document.createElement('span');
      criteriumEl.className = 'score-criterium';
      criteriumEl.textContent = criterium;

      const scoreEl = document.createElement('span');
      scoreEl.className = `score-label ${scoreClass}`;
      scoreEl.textContent = normalizedScore;

      row.appendChild(dot);
      row.appendChild(criteriumEl);
      row.appendChild(scoreEl);
      container.appendChild(row);
    }
  }

  return container;
}

export function renderFeedbackSafe(text: string): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const { grouped, content } = extractScoreGroups(text);
  const scoreTable = buildScoreTable(grouped);
  if (scoreTable) {
    fragment.appendChild(scoreTable);
  }

  let currentList: HTMLUListElement | null = null;

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line) {
      currentList = null;
      continue;
    }

    if (line.startsWith('- ')) {
      if (!currentList) {
        currentList = document.createElement('ul');
        fragment.appendChild(currentList);
      }

      const li = document.createElement('li');
      appendInlineContent(li, line.slice(2));
      currentList.appendChild(li);
      continue;
    }

    currentList = null;

    if (line.startsWith('### ')) {
      const heading = document.createElement('h4');
      appendInlineContent(heading, line.slice(4));
      fragment.appendChild(heading);
      continue;
    }

    if (line.startsWith('## ')) {
      const heading = document.createElement('h3');
      appendInlineContent(heading, line.slice(3));
      fragment.appendChild(heading);
      continue;
    }

    const paragraph = document.createElement('p');
    appendInlineContent(paragraph, line);
    fragment.appendChild(paragraph);
  }

  return fragment;
}
