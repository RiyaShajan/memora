
export const BOX_INTERVALS = [1, 2, 4, 7, 14];

const STORAGE_KEY = "memora-leitner-v1";

// Generate unique IDs
export function createId() {
    return crypto.randomUUID();
}

// Load saved data
export function loadData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        return saved
            ? JSON.parse(saved)
            : { decks: [], cards: [], history: [] };
    } catch {
        return { decks: [], cards: [], history: [] };
    }
}

// Save data
export function saveData(data) {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
    );
}

// Create a new deck
export function createDeck(name, subject = "") {
    return {
        id: createId(),
        name: name.trim(),
        subject: subject.trim(),
        createdAt: Date.now(),
    };
}

// Create a new flashcard
export function createCard(deckId, question, answer) {
    return {
        id: createId(),
        deckId,
        question: question.trim(),
        answer: answer.trim(),
        box: 1,
        dueDate: Date.now(),
        createdAt: Date.now(),
        reviews: 0,
        correctReviews: 0,
    };
}

// Calculate the next review date
export function getNextReviewDate(box) {
    const days = BOX_INTERVALS[box - 1];
    const date = new Date();

    date.setDate(date.getDate() + days);

    return date.getTime();
}

// Update a card after reviewing
export function reviewCard(card, remembered) {
    const nextBox = remembered
        ? Math.min(card.box + 1, 5)
        : 1;

    return {
        ...card,
        box: nextBox,
        dueDate: getNextReviewDate(nextBox),
        reviews: card.reviews + 1,
        correctReviews:
            card.correctReviews + (remembered ? 1 : 0),
        lastReviewed: Date.now(),
    };
}

// Find cards that are due for review
export function getDueCards(cards, deckId = null) {
    return cards
        .filter(
            (card) =>
                card.dueDate <= Date.now() &&
                (deckId === null || card.deckId === deckId)
        )
        .sort((a, b) => a.dueDate - b.dueDate);
}

// Count cards in each box
export function getBoxCounts(cards) {
    return [1, 2, 3, 4, 5].map(
        (box) => cards.filter(
            (card) => card.box === box
        ).length
    );
}

// Calculate learning statistics
export function getStats(cards) {
    const totalReviews = cards.reduce(
        (sum, card) => sum + card.reviews,
        0
    );

    const correctReviews = cards.reduce(
        (sum, card) => sum + card.correctReviews,
        0
    );

    return {
        totalCards: cards.length,
        dueCards: getDueCards(cards).length,
        masteredCards: cards.filter(
            (card) => card.box === 5
        ).length,
        totalReviews,
        retentionRate: totalReviews
            ? Math.round(
                (correctReviews / totalReviews) * 100
            )
            : 0,
        boxCounts: getBoxCounts(cards),
    };
}
