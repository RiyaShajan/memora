
/* ========================================
   MEMORA — BLURTING SYSTEM LOGIC
   ======================================== */

const STORAGE_KEY = "memora-blurting-v1";

export const TIMER_OPTIONS = [
  { label: "No timer", minutes: 0 },
  { label: "2 minutes", minutes: 2 },
  { label: "5 minutes", minutes: 5 },
  { label: "10 minutes", minutes: 10 },
  { label: "15 minutes", minutes: 15 },
];

// Generate unique IDs

export function createId() {
  return crypto.randomUUID();
}

// Load saved topics and sessions

export function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return {
        topics: [],
        sessions: [],
      };
    }

    const parsed = JSON.parse(saved);

    return {
      topics: Array.isArray(parsed.topics)
        ? parsed.topics
        : [],
      sessions: Array.isArray(parsed.sessions)
        ? parsed.sessions
        : [],
    };
  } catch {
    return {
      topics: [],
      sessions: [],
    };
  }
}

// Save data

export function saveData(data) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(data)
  );
}

// Convert comma-separated or line-separated
// concepts into an array

export function parseConcepts(value = "") {
  const concepts = value
    .split(/[,\n]+/)
    .map((concept) => concept.trim())
    .filter(Boolean);

  const unique = new Map();

  concepts.forEach((concept) => {
    const key = normalizeText(concept);

    if (key && !unique.has(key)) {
      unique.set(key, concept);
    }
  });

  return [...unique.values()];
}

// Create a new topic

export function createTopic(
  title,
  subject,
  notes,
  concepts = ""
) {
  return {
    id: createId(),
    title: title.trim(),
    subject: subject.trim(),
    notes: notes.trim(),
    concepts: parseConcepts(concepts),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// Update an existing topic

export function updateTopic(
  topic,
  title,
  subject,
  notes,
  concepts
) {
  return {
    ...topic,
    title: title.trim(),
    subject: subject.trim(),
    notes: notes.trim(),
    concepts: parseConcepts(concepts),
    updatedAt: Date.now(),
  };
}

// Normalize text for comparison

export function normalizeText(text = "") {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Count words

export function countWords(text = "") {
  const cleaned = text.trim();

  return cleaned
    ? cleaned.split(/\s+/).length
    : 0;
}

// Check whether a concept appears
// as a complete word or phrase

export function containsConcept(text, concept) {
  const normalizedText = normalizeText(text);
  const normalizedConcept = normalizeText(concept);

  if (!normalizedConcept) return false;

  return ` ${normalizedText} `.includes(
    ` ${normalizedConcept} `
  );
}

// Compare recalled content with key concepts

export function compareRecall(
  recall,
  concepts = []
) {
  const matched = [];
  const missing = [];

  concepts.forEach((concept) => {
    if (containsConcept(recall, concept)) {
      matched.push(concept);
    } else {
      missing.push(concept);
    }
  });

  const totalConcepts = concepts.length;

  const coverage = totalConcepts
    ? Math.round(
        (matched.length / totalConcepts) * 100
      )
    : null;

  return {
    matched,
    missing,
    totalConcepts,
    coverage,
    wordCount: countWords(recall),
  };
}

// Create a completed blurting session

export function createSession({
  topic,
  recall,
  durationSeconds = 0,
  timerMinutes = 0,
  selfRating = null,
  reflection = "",
}) {
  const comparison = compareRecall(
    recall,
    topic.concepts
  );

  return {
    id: createId(),
    topicId: topic.id,
    topicTitle: topic.title,
    subject: topic.subject,

    // Preserve original reference material
    // even if the topic is edited later

    referenceNotes: topic.notes,
    referenceConcepts: [...topic.concepts],

    recall: recall.trim(),
    durationSeconds: Math.max(
      0,
      Math.round(durationSeconds)
    ),
    timerMinutes,
    selfRating,
    reflection: reflection.trim(),

    ...comparison,

    createdAt: Date.now(),
  };
}

// Get previous sessions for a topic

export function getTopicSessions(
  sessions,
  topicId
) {
  return sessions
    .filter(
      (session) => session.topicId === topicId
    )
    .sort(
      (a, b) => b.createdAt - a.createdAt
    );
}

// Calculate progress for a topic

export function getTopicProgress(
  sessions,
  topicId
) {
  const history = getTopicSessions(
    sessions,
    topicId
  );

  const scored = history.filter(
    (session) => Number.isFinite(session.coverage)
  );

  const latest = scored[0] || null;

  // Compare sessions only when the reference
  // concepts are the same.

  const comparable = latest
    ? scored.filter((session) => {
        const current = latest.referenceConcepts
          .map(normalizeText)
          .sort();

        const previous = session.referenceConcepts
          .map(normalizeText)
          .sort();

        return (
          JSON.stringify(current) ===
          JSON.stringify(previous)
        );
      })
    : [];

  const first =
    comparable[comparable.length - 1] || null;

  const bestCoverage = comparable.length
    ? Math.max(
        ...comparable.map(
          (session) => session.coverage
        )
      )
    : null;

  const improvement =
    comparable.length >= 2
      ? latest.coverage - first.coverage
      : null;

  return {
    totalSessions: history.length,
    latestCoverage: latest?.coverage ?? null,
    bestCoverage,
    improvement,
    comparableSessions: comparable.length,
  };
}

// Calculate dashboard statistics

export function getStats(topics, sessions) {
  const totalSeconds = sessions.reduce(
    (sum, session) =>
      sum + (session.durationSeconds || 0),
    0
  );

  const scoredSessions = sessions.filter(
    (session) =>
      Number.isFinite(session.coverage)
  );

  const averageCoverage = scoredSessions.length
    ? Math.round(
        scoredSessions.reduce(
          (sum, session) =>
            sum + session.coverage,
          0
        ) / scoredSessions.length
      )
    : null;

  const ratedSessions = sessions.filter(
    (session) =>
      Number.isFinite(session.selfRating)
  );

  const averageRating = ratedSessions.length
    ? Number(
        (
          ratedSessions.reduce(
            (sum, session) =>
              sum + session.selfRating,
            0
          ) / ratedSessions.length
        ).toFixed(1)
      )
    : null;

  return {
    totalTopics: topics.length,
    totalSessions: sessions.length,
    totalSeconds,
    totalMinutes: Math.round(totalSeconds / 60),
    averageCoverage,
    averageRating,
  };
}

// Format timer as MM:SS

export function formatTime(seconds) {
  const safeSeconds = Math.max(
    0,
    Math.floor(seconds)
  );

  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

// Format session date

export function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}
