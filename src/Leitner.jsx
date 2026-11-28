
import { useState, useEffect } from "react";
import "./Leitner.css";

import {
  loadData,
  saveData,
  createDeck,
  createCard,
  reviewCard,
  getDueCards,
  getStats,
  BOX_INTERVALS,
} from "./LeitnerUtils";

export default function Leitner({ onBack }) {
  const [data, setData] = useState(loadData);
  const [activeDeck, setActiveDeck] = useState(null);
  const [screen, setScreen] = useState("dashboard");

  const [deckName, setDeckName] = useState("");
  const [subject, setSubject] = useState("");
  const [editingDeck, setEditingDeck] = useState(null);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [editingCard, setEditingCard] = useState(null);

  const [reviewQueue, setReviewQueue] = useState([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [storageError, setStorageError] = useState("");

  useEffect(() => {
    try {
      saveData(data);
      setStorageError("");
    } catch {
      setStorageError(
        "Unable to save your progress. Check browser storage."
      );
    }
  }, [data]);

  const stats = getStats(data.cards);

  const currentDeck = data.decks.find(
    (deck) => deck.id === activeDeck
  );

  const deckCards = data.cards.filter(
    (card) => card.deckId === activeDeck
  );

  const currentCard = data.cards.find(
    (card) => card.id === reviewQueue[reviewIndex]
  );

  // The edit forms sit above the lists, so bring them into view.
  function scrollToForm(id) {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // DECK MANAGEMENT

  function resetDeckForm() {
    setDeckName("");
    setSubject("");
    setEditingDeck(null);
  }

  function handleSaveDeck(e) {
    e.preventDefault();

    if (!deckName.trim()) return;

    setData((prev) => ({
      ...prev,
      decks: editingDeck
        ? prev.decks.map((deck) =>
            deck.id === editingDeck
              ? {
                  ...deck,
                  name: deckName.trim(),
                  subject: subject.trim(),
                }
              : deck
          )
        : [
            ...prev.decks,
            createDeck(deckName, subject),
          ],
    }));

    resetDeckForm();
  }

  function handleEditDeck(deck) {
    setEditingDeck(deck.id);
    setDeckName(deck.name);
    setSubject(deck.subject);
    scrollToForm("leitner-deck-form");
  }

  function handleDeleteDeck(id) {
    if (
      !window.confirm(
        "Delete this deck and all its flashcards?"
      )
    ) return;

    setData((prev) => ({
      ...prev,
      decks: prev.decks.filter(
        (deck) => deck.id !== id
      ),
      cards: prev.cards.filter(
        (card) => card.deckId !== id
      ),
      history: prev.history.filter(
        (entry) => entry.deckId !== id
      ),
    }));

    resetDeckForm();
  }

  function openDeck(id) {
    setActiveDeck(id);
    resetCardForm();
    setScreen("deck");
  }

  // FLASHCARD MANAGEMENT

  function resetCardForm() {
    setQuestion("");
    setAnswer("");
    setEditingCard(null);
  }

  function handleSaveCard(e) {
    e.preventDefault();

    if (!question.trim() || !answer.trim()) return;

    setData((prev) => ({
      ...prev,
      cards: editingCard
        ? prev.cards.map((card) =>
            card.id === editingCard
              ? {
                  ...card,
                  question: question.trim(),
                  answer: answer.trim(),
                }
              : card
          )
        : [
            ...prev.cards,
            createCard(activeDeck, question, answer),
          ],
    }));

    resetCardForm();
  }

  function handleEditCard(card) {
    setEditingCard(card.id);
    setQuestion(card.question);
    setAnswer(card.answer);
    scrollToForm("leitner-card-form");
  }

  function handleDeleteCard(id) {
    if (!window.confirm("Delete this flashcard?")) {
      return;
    }

    setData((prev) => ({
      ...prev,
      cards: prev.cards.filter(
        (card) => card.id !== id
      ),
      history: prev.history.filter(
        (entry) => entry.cardId !== id
      ),
    }));

    resetCardForm();
  }

  // REVIEW SESSION

  function startReview(deckId = null) {
    const due = getDueCards(data.cards, deckId);

    if (!due.length) return;

    setReviewQueue(due.map((card) => card.id));
    setReviewIndex(0);
    setSessionCorrect(0);
    setFlipped(false);
    setScreen("review");
  }

  function handleReview(remembered) {
    if (!currentCard || !flipped) return;

    const updatedCard = reviewCard(
      currentCard,
      remembered
    );

    setData((prev) => ({
      ...prev,
      cards: prev.cards.map((card) =>
        card.id === currentCard.id
          ? updatedCard
          : card
      ),
      history: [
        ...prev.history,
        {
          cardId: currentCard.id,
          deckId: currentCard.deckId,
          remembered,
          previousBox: currentCard.box,
          nextBox: updatedCard.box,
          reviewedAt: Date.now(),
        },
      ],
    }));

    if (remembered) {
      setSessionCorrect((prev) => prev + 1);
    }

    setFlipped(false);

    if (reviewIndex + 1 >= reviewQueue.length) {
      setScreen("result");
    } else {
      setReviewIndex((prev) => prev + 1);
    }
  }

  function goDashboard() {
    setScreen("dashboard");
    setActiveDeck(null);
    resetCardForm();
    resetDeckForm();
  }

  return (
    <section className="leitner">

      <header className="leitner-header">
        <button
          className="leitner-back"
          onClick={
            screen === "dashboard"
              ? onBack
              : goDashboard
          }
        >
          ← {screen === "dashboard"
            ? "Back to Memora"
            : "Dashboard"}
        </button>

        <span className="leitner-kicker">
          ✧ MEMORY TRAINING / 02
        </span>
      </header>

      {storageError && (
        <p role="alert">{storageError}</p>
      )}

      {/* DASHBOARD */}

      {screen === "dashboard" && (
        <>
          <div className="leitner-intro">
            <span className="leitner-kicker">
              THE ART OF REMEMBERING
            </span>

            <h1>Leitner System.</h1>

            <p>
              Remember what matters, one card at a time.
            </p>
          </div>

          <div className="leitner-stats">
            <div className="leitner-stat">
              <span>Total cards</span>
              <strong>{stats.totalCards}</strong>
            </div>

            <div className="leitner-stat">
              <span>Due today</span>
              <strong>{stats.dueCards}</strong>
            </div>

            <div className="leitner-stat">
              <span>Retention</span>
              <strong>
                {stats.totalReviews
                  ? `${stats.retentionRate}%`
                  : "—"}
              </strong>
            </div>

            <div className="leitner-stat">
              <span>Mastered</span>
              <strong>{stats.masteredCards}</strong>
            </div>
          </div>

          <div className="leitner-section">
            <h2>Your memory boxes</h2>

            <p>
              Move forward with every successful recall.
            </p>

            <div className="leitner-boxes">
              {stats.boxCounts.map((count, index) => (
                <div
                  className="leitner-box"
                  key={index}
                >
                  <span>Box {index + 1}</span>
                  <strong>{count}</strong>
                  <span>cards</span>
                  <small>
                    Every {BOX_INTERVALS[index]} day
                    {BOX_INTERVALS[index] !== 1
                      ? "s"
                      : ""}
                  </small>
                </div>
              ))}
            </div>

            <button
              className="leitner-primary"
              disabled={!stats.dueCards}
              onClick={() => startReview()}
            >
              Review all due cards →
            </button>
          </div>

          <div className="leitner-section">
            <h2>
              {editingDeck
                ? "Edit your deck"
                : "Create a deck"}
            </h2>

            <form
              id="leitner-deck-form"
              className="leitner-form"
              onSubmit={handleSaveDeck}
            >
              <input
                placeholder="Deck name"
                aria-label="Deck name"
                value={deckName}
                onChange={(e) =>
                  setDeckName(e.target.value)
                }
                required
              />

              <input
                placeholder="Subject (optional)"
                aria-label="Subject"
                value={subject}
                onChange={(e) =>
                  setSubject(e.target.value)
                }
              />

              <button className="leitner-primary">
                {editingDeck
                  ? "Save changes"
                  : "+ Create deck"}
              </button>

              {editingDeck && (
                <button
                  type="button"
                  className="leitner-secondary"
                  onClick={resetDeckForm}
                >
                  Cancel
                </button>
              )}
            </form>
          </div>

          <div className="leitner-section">
            <h2>Your decks</h2>

            {!data.decks.length && (
              <div className="leitner-empty">
                <span>✧</span>
                <h3>A little room for knowledge.</h3>
                <p>
                  Create your first deck to begin
                  your learning journey.
                </p>
              </div>
            )}

            <div className="leitner-decks">
              {data.decks.map((deck) => {
                const cards = data.cards.filter(
                  (card) => card.deckId === deck.id
                );

                const due = getDueCards(cards).length;

                return (
                  <article
                    className="leitner-deck"
                    key={deck.id}
                  >
                    <span className="leitner-deck-icon">
                      ▤
                    </span>

                    <h3>{deck.name}</h3>
                    <p>
                      {deck.subject || "General"}
                    </p>

                    <div className="leitner-deck-meta">
                      <span>{cards.length} cards</span>
                      <span>{due} due</span>
                    </div>

                    <div className="leitner-actions">
                      <button
                        className="leitner-primary"
                        onClick={() => openDeck(deck.id)}
                      >
                        Open deck →
                      </button>

                      <button
                        className="leitner-secondary"
                        onClick={() =>
                          handleEditDeck(deck)
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="leitner-danger"
                        onClick={() =>
                          handleDeleteDeck(deck.id)
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* DECK DETAILS */}

      {screen === "deck" && currentDeck && (
        <>
          <div className="leitner-intro">
            <span className="leitner-kicker">
              {currentDeck.subject || "YOUR DECK"}
            </span>

            <h1>{currentDeck.name}</h1>

            <p>
              {deckCards.length} flashcards ·{" "}
              {getDueCards(deckCards).length} due
            </p>

            <button
              className="leitner-primary"
              disabled={!getDueCards(deckCards).length}
              onClick={() => startReview(activeDeck)}
            >
              Start review →
            </button>
          </div>

          <div className="leitner-section">
            <h2>
              {editingCard
                ? "Edit flashcard"
                : "Create a flashcard"}
            </h2>

            <form
              id="leitner-card-form"
              className="leitner-form leitner-card-form"
              onSubmit={handleSaveCard}
            >
              <label htmlFor="leitner-question">
                Question or concept
              </label>

              <textarea
                id="leitner-question"
                placeholder="What do you want to remember?"
                value={question}
                onChange={(e) =>
                  setQuestion(e.target.value)
                }
                required
              />

              <label htmlFor="leitner-answer">Answer</label>

              <textarea
                id="leitner-answer"
                placeholder="Write the answer here..."
                value={answer}
                onChange={(e) =>
                  setAnswer(e.target.value)
                }
                required
              />

              <button className="leitner-primary">
                {editingCard
                  ? "Save changes"
                  : "+ Add flashcard"}
              </button>

              {editingCard && (
                <button
                  type="button"
                  className="leitner-secondary"
                  onClick={resetCardForm}
                >
                  Cancel
                </button>
              )}
            </form>
          </div>

          <div className="leitner-section">
            <h2>Your flashcards</h2>

            {!deckCards.length && (
              <div className="leitner-empty">
                <p>No flashcards yet. Add your first!</p>
              </div>
            )}

            <div className="leitner-flashcards">
              {deckCards.map((card) => (
                <article
                  className="leitner-flashcard"
                  key={card.id}
                >
                  <span className="leitner-box-label">
                    Box {card.box}
                  </span>

                  <h3>{card.question}</h3>
                  <p>{card.answer}</p>

                  <small>
                    Next review:{" "}
                    {card.dueDate <= Date.now()
                      ? "Due now"
                      : new Date(
                          card.dueDate
                        ).toLocaleDateString()}
                  </small>

                  <div className="leitner-actions">
                    <button
                      className="leitner-secondary"
                      onClick={() => handleEditCard(card)}
                    >
                      Edit
                    </button>

                    <button
                      className="leitner-danger"
                      onClick={() =>
                        handleDeleteCard(card.id)
                      }
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </>
      )}

      {/* REVIEW SCREEN */}

      {screen === "review" && currentCard && (
        <div className="leitner-review">
          <span className="leitner-kicker">
            ✧ ACTIVE RECALL SESSION
          </span>

          <h2>Take your time.</h2>

          <p>
            Card {reviewIndex + 1} of{" "}
            {reviewQueue.length}
          </p>

          <div className="leitner-progress">
            <div
              style={{
                width: `${
                  (reviewIndex / reviewQueue.length) * 100
                }%`,
              }}
            />
          </div>

          <button
            className={`leitner-review-card ${
              flipped ? "flipped" : ""
            }`}
            onClick={() => setFlipped(!flipped)}
          >
            <span className="leitner-box-label">
              Box {currentCard.box}
            </span>

            <span className="leitner-kicker">
              {flipped ? "ANSWER" : "QUESTION"}
            </span>

            <h3>
              {flipped
                ? currentCard.answer
                : currentCard.question}
            </h3>

            <small>
              {flipped
                ? "Click to see question"
                : "Click to reveal answer"}
            </small>
          </button>

          <p>
            {flipped
              ? "Did you remember the answer?"
              : "Try recalling before revealing."}
          </p>

          <div className="leitner-review-actions">
            <button
              className="leitner-forgot"
              disabled={!flipped}
              onClick={() => handleReview(false)}
            >
              ↺ Forgot
            </button>

            <button
              className="leitner-remembered"
              disabled={!flipped}
              onClick={() => handleReview(true)}
            >
              ✓ Remembered
            </button>
          </div>
        </div>
      )}

      {/* SESSION RESULTS */}

      {screen === "result" && (
        <div className="leitner-result">
          <span className="leitner-result-icon">✧</span>

          <span className="leitner-kicker">
            SESSION COMPLETE
          </span>

          <h1>A little wiser today.</h1>

          <p>
            Every recall is a step towards
            stronger memories.
          </p>

          <div className="leitner-result-score">
            {Math.round(
              (sessionCorrect / reviewQueue.length) * 100
            )}%
          </div>

          <div className="leitner-stats">
            <div className="leitner-stat">
              <span>Reviewed</span>
              <strong>{reviewQueue.length}</strong>
            </div>

            <div className="leitner-stat">
              <span>Remembered</span>
              <strong>{sessionCorrect}</strong>
            </div>

            <div className="leitner-stat">
              <span>Forgotten</span>
              <strong>
                {reviewQueue.length - sessionCorrect}
              </strong>
            </div>
          </div>

          <button
            className="leitner-primary"
            onClick={goDashboard}
          >
            Return to dashboard →
          </button>
        </div>
      )}

    </section>
  );
}
