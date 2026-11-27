// Answer matching for Kim's Game. Pure functions, no React.

// Fisher–Yates: unbiased (the old sort(() => Math.random() - 0.5) is not).
export function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(a|an|the|my|some)\s+/, "");
}

// "keys" -> "key", "glasses" -> "glasse"/"glass"; compare any variant.
function variants(text) {
  const set = new Set([text, text.replace(/\s+/g, "")]);
  for (const t of [...set]) {
    if (t.endsWith("ies")) set.add(t.slice(0, -3) + "y");
    if (t.endsWith("es")) set.add(t.slice(0, -2));
    if (t.endsWith("s")) set.add(t.slice(0, -1));
  }
  return set;
}

function distance(a, b) {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = prev[j];
      prev[j] = Math.min(
        prev[j] + 1,
        prev[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      diagonal = temp;
    }
  }
  return prev[b.length];
}

function keysFor(object) {
  return [object.name, ...(object.aliases ?? [])].map(normalize);
}

function allowedTypos(length) {
  if (length <= 3) return 0;
  if (length <= 6) return 1;
  return 2;
}

export function splitAnswer(raw) {
  return raw
    .split(/[,;\n]+|\band\b|&/i)
    .map(normalize)
    .filter(Boolean);
}

/**
 * Compare what the player typed with the objects that were shown.
 * - Each typed item matches at most one object, and each object once.
 * - Exact/alias matches (singular or plural) win first, then close typos.
 * - Fuzzy matching only runs against objects in this round, and a
 *   typo that is equally close to two objects is ignored, not guessed.
 * Returns { correct, missed, extras, score }.
 */
export function checkAnswers(raw, shown) {
  const tokens = [...new Set(splitAnswer(raw))];
  const matched = new Map(); // object.id -> object
  const usedTokens = new Set();

  // Pass 1: exact / alias / plural
  for (const token of tokens) {
    const tokenVariants = variants(token);
    const hit = shown.find(
      (object) =>
        !matched.has(object.id) &&
        keysFor(object).some((key) => {
          const keyVariants = variants(key);
          return [...tokenVariants].some((v) => keyVariants.has(v));
        })
    );
    if (hit) {
      matched.set(hit.id, hit);
      usedTokens.add(token);
    }
  }

  // Pass 2: close typos ("bananna", "umbrela")
  for (const token of tokens) {
    if (usedTokens.has(token)) continue;
    const limit = allowedTypos(token.length);
    if (limit === 0) continue;

    let best = null;
    let bestDistance = Infinity;
    let tie = false;
    for (const object of shown) {
      if (matched.has(object.id)) continue;
      const d = Math.min(...keysFor(object).map((key) => distance(token, key)));
      if (d < bestDistance) {
        best = object;
        bestDistance = d;
        tie = false;
      } else if (d === bestDistance) {
        tie = true;
      }
    }
    if (best && bestDistance <= limit && !tie) {
      matched.set(best.id, best);
      usedTokens.add(token);
    }
  }

  const correct = shown.filter((object) => matched.has(object.id));
  const missed = shown.filter((object) => !matched.has(object.id));
  const extras = tokens.filter((token) => !usedTokens.has(token));

  return {
    correct,
    missed,
    extras,
    score: shown.length ? Math.round((correct.length / shown.length) * 100) : 0,
  };
}
