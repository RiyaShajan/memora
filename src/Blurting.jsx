
import { useState, useEffect } from "react";
import "./Blurting.css";

import {
  loadData,
  saveData,
  createTopic,
  updateTopic,
  createSession,
  compareRecall,
  countWords,
  getTopicSessions,
  getTopicProgress,
  getStats,
  formatTime,
  formatDate,
  TIMER_OPTIONS,
} from "./BlurtingUtils";

export default function Blurting({ onBack }) {
  // APPLICATION STATE

  const [data, setData] = useState(loadData);
  const [screen, setScreen] = useState("dashboard");
  const [activeTopicId, setActiveTopicId] = useState(null);
  const [storageError, setStorageError] = useState("");

  // TOPIC FORM

  const [editingTopic, setEditingTopic] = useState(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [notes, setNotes] = useState("");
  const [concepts, setConcepts] = useState("");

  // RECALL SESSION

  const [sessionTopic, setSessionTopic] = useState(null);
  const [recall, setRecall] = useState("");
  const [timerMinutes, setTimerMinutes] = useState(5);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const [finishedAt, setFinishedAt] = useState(null);

  // SELF ASSESSMENT

  const [selfRating, setSelfRating] = useState(null);
  const [reflection, setReflection] = useState("");
  const [selectedSession, setSelectedSession] = useState(null);

  const activeTopic = data.topics.find(
    (topic) => topic.id === activeTopicId
  );

  const stats = getStats(
    data.topics,
    data.sessions
  );

  const topicSessions = activeTopic
    ? getTopicSessions(
        data.sessions,
        activeTopic.id
      )
    : [];

  const topicProgress = activeTopic
    ? getTopicProgress(
        data.sessions,
        activeTopic.id
      )
    : null;

  const comparison = compareRecall(
    recall,
    sessionTopic?.concepts || []
  );

  // LOCAL STORAGE

  useEffect(() => {
    try {
      saveData(data);
      setStorageError("");
    } catch {
      setStorageError(
        "Unable to save your progress. Please check browser storage."
      );
    }
  }, [data]);

  // COUNTDOWN TIMER

  useEffect(() => {
    if (
      screen !== "recall" ||
      timerMinutes === 0 ||
      !startedAt
    ) {
      return;
    }

    const deadline =
      startedAt + timerMinutes * 60 * 1000;

    function updateTimer() {
      const remaining = Math.max(
        0,
        Math.ceil(
          (deadline - Date.now()) / 1000
        )
      );

      setTimeLeft(remaining);

      if (remaining === 0) {
        setFinishedAt(deadline);
        setScreen("comparison");
      }
    }

    updateTimer();

    const interval = setInterval(
      updateTimer,
      250
    );

    return () => clearInterval(interval);
  }, [screen, timerMinutes, startedAt]);

  // TOPIC MANAGEMENT

  function resetTopicForm() {
    setTitle("");
    setSubject("");
    setNotes("");
    setConcepts("");
    setEditingTopic(null);
  }

  function openNewTopic() {
    resetTopicForm();
    setScreen("form");
  }

  function handleEditTopic(topic) {
    setEditingTopic(topic.id);
    setTitle(topic.title);
    setSubject(topic.subject);
    setNotes(topic.notes);
    setConcepts(topic.concepts.join("\n"));
    setScreen("form");
  }

  function handleSaveTopic(e) {
    e.preventDefault();

    if (!title.trim() || !notes.trim()) {
      return;
    }

    if (editingTopic) {
      setData((prev) => ({
        ...prev,
        topics: prev.topics.map((topic) =>
          topic.id === editingTopic
            ? updateTopic(
                topic,
                title,
                subject,
                notes,
                concepts
              )
            : topic
        ),
      }));
    } else {
      const newTopic = createTopic(
        title,
        subject,
        notes,
        concepts
      );

      setData((prev) => ({
        ...prev,
        topics: [...prev.topics, newTopic],
      }));
    }

    resetTopicForm();
    setScreen("dashboard");
  }

  function handleDeleteTopic(id) {
    const confirmed = window.confirm(
      "Delete this topic and all its saved sessions?"
    );

    if (!confirmed) return;

    setData((prev) => ({
      ...prev,
      topics: prev.topics.filter(
        (topic) => topic.id !== id
      ),
      sessions: prev.sessions.filter(
        (session) => session.topicId !== id
      ),
    }));

    setActiveTopicId(null);
    setScreen("dashboard");
  }

  function openTopic(id) {
    setActiveTopicId(id);
    setScreen("study");
  }

  // RECALL SESSION MANAGEMENT

  function startRecall() {
    if (!activeTopic) return;

    setSessionTopic({
      ...activeTopic,
      concepts: [...activeTopic.concepts],
    });

    setRecall("");
    setSelfRating(null);
    setReflection("");
    setFinishedAt(null);
    setStartedAt(Date.now());
    setTimeLeft(timerMinutes * 60);
    setScreen("recall");
  }

  function finishRecall() {
    setFinishedAt(Date.now());
    setScreen("comparison");
  }

  function saveSession() {
    if (!sessionTopic || !startedAt) {
      return;
    }

    const durationSeconds = Math.max(
      0,
      Math.round(
        ((finishedAt || Date.now()) - startedAt) /
          1000
      )
    );

    const session = createSession({
      topic: sessionTopic,
      recall,
      durationSeconds,
      timerMinutes,
      selfRating,
      reflection,
    });

    setData((prev) => ({
      ...prev,
      sessions: [...prev.sessions, session],
    }));

    setSelectedSession(session);
    setScreen("result");
  }

  // NAVIGATION

  function goDashboard() {
    setScreen("dashboard");
    setActiveTopicId(null);
    resetTopicForm();
  }

  function handleBack() {
    if (screen === "dashboard") {
      onBack();
      return;
    }

    if (
      screen === "recall" ||
      screen === "comparison"
    ) {
      const confirmed = window.confirm(
        "Leave this session? Your unsaved recall will be lost."
      );

      if (!confirmed) return;
    }

    if (screen === "history-detail") {
      setScreen("history");
      return;
    }

    goDashboard();
  }

  function openHistory() {
    setScreen("history");
  }

  function openSession(session) {
    setSelectedSession(session);
    setScreen("history-detail");
  }

  function displayCoverage(value) {
    return Number.isFinite(value)
      ? `${value}%`
      : "—";
  }

  // REUSABLE COMPARISON DISPLAY

  function renderComparison(result) {
    return (
      <div className="blurting-comparison">

        <div className="blurting-coverage">
          <span className="blurting-kicker">
            KEY CONCEPT COVERAGE
          </span>

          <strong>
            {displayCoverage(result.coverage)}
          </strong>

          {Number.isFinite(result.coverage) && (
            <div className="blurting-progress">
              <div
                style={{
                  width: `${result.coverage}%`,
                }}
              />
            </div>
          )}

          <p>
            {result.totalConcepts
              ? `${result.matched.length} of ${result.totalConcepts} key concepts found`
              : "No key concepts were specified for this topic."}
          </p>

          <small>
            Keyword coverage is not a measure
            of complete understanding.
          </small>
        </div>

        <div className="blurting-concept-grid">

          <div className="blurting-concept-panel matched">
            <h3>✓ Matched concepts</h3>

            {result.matched.length ? (
              <ul>
                {result.matched.map((concept) => (
                  <li key={concept}>
                    {concept}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No matching concepts found.</p>
            )}
          </div>

          <div className="blurting-concept-panel missing">
            <h3>↺ Concepts to revisit</h3>

            {result.missing.length ? (
              <ul>
                {result.missing.map((concept) => (
                  <li key={concept}>
                    {concept}
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                {result.totalConcepts
                  ? "All specified concepts were found!"
                  : "Compare your notes manually."}
              </p>
            )}
          </div>

        </div>
      </div>
    );
  }

  // MAIN INTERFACE

  return (
    <section className="blurting">

      <header className="blurting-header">
        <button
          className="blurting-back"
          onClick={handleBack}
        >
          ← {screen === "dashboard"
            ? "Back to Memora"
            : screen === "history-detail"
              ? "Session history"
              : "Dashboard"}
        </button>

        <span className="blurting-kicker">
          ✧ MEMORY TRAINING / 03
        </span>
      </header>

      {storageError && (
        <p role="alert">
          {storageError}
        </p>
      )}

      {/* ==================================
          DASHBOARD
          ================================== */}

      {screen === "dashboard" && (
        <>
          <div className="blurting-intro">
            <span className="blurting-kicker">
              THE ART OF ACTIVE RECALL
            </span>

            <h1>Blurting Method.</h1>

            <p>
              Think freely. Write everything.
              Discover what you know.
            </p>
          </div>

          <div className="blurting-stats">

            <div className="blurting-stat">
              <span>Your topics</span>
              <strong>{stats.totalTopics}</strong>
            </div>

            <div className="blurting-stat">
              <span>Recall sessions</span>
              <strong>{stats.totalSessions}</strong>
            </div>

            <div className="blurting-stat">
              <span>Recall time</span>
              <strong>{stats.totalMinutes}m</strong>
            </div>

            <div className="blurting-stat">
              <span>Average coverage</span>
              <strong>
                {displayCoverage(
                  stats.averageCoverage
                )}
              </strong>
            </div>

          </div>

          <div className="blurting-guide">
            <span className="blurting-kicker">
              HOW IT WORKS
            </span>

            <div className="blurting-guide-grid">
              {[
                ["01", "Study", "Understand your topic."],
                ["02", "Recall", "Write without your notes."],
                ["03", "Compare", "Discover knowledge gaps."],
                ["04", "Repeat", "Strengthen your memory."],
              ].map(([number, name, description]) => (
                <div
                  className="blurting-guide-step"
                  key={number}
                >
                  <span>{number}</span>
                  <h3>{name}</h3>
                  <p>{description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="blurting-section">

            <div className="blurting-section-heading">
              <div>
                <h2>Your topics</h2>
                <p>
                  Make a little room for knowledge.
                </p>
              </div>

              <button
                className="blurting-primary"
                onClick={openNewTopic}
              >
                + New topic
              </button>
            </div>

            {!data.topics.length && (
              <div className="blurting-empty">
                <span>✧</span>

                <h3>Every idea begins somewhere.</h3>

                <p>
                  Create your first topic
                  and begin exploring your memory.
                </p>

                <button
                  className="blurting-primary"
                  onClick={openNewTopic}
                >
                  Create your first topic →
                </button>
              </div>
            )}

            <div className="blurting-topics">

              {data.topics.map((topic) => {
                const progress = getTopicProgress(
                  data.sessions,
                  topic.id
                );

                return (
                  <article
                    className="blurting-topic"
                    key={topic.id}
                  >
                    <span className="blurting-topic-icon">
                      ✎
                    </span>

                    <span className="blurting-kicker">
                      {topic.subject || "GENERAL"}
                    </span>

                    <h3>{topic.title}</h3>

                    <p>
                      {topic.notes.length > 120
                        ? `${topic.notes.slice(0, 120)}...`
                        : topic.notes}
                    </p>

                    <div className="blurting-topic-meta">
                      <span>
                        {progress.totalSessions} sessions
                      </span>

                      <span>
                        Latest coverage:{" "}
                        {displayCoverage(
                          progress.latestCoverage
                        )}
                      </span>
                    </div>

                    <div className="blurting-actions">

                      <button
                        className="blurting-primary"
                        onClick={() =>
                          openTopic(topic.id)
                        }
                      >
                        Open topic →
                      </button>

                      <button
                        className="blurting-secondary"
                        onClick={() =>
                          handleEditTopic(topic)
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="blurting-danger"
                        onClick={() =>
                          handleDeleteTopic(topic.id)
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

          <div className="blurting-section">

            <div className="blurting-section-heading">
              <div>
                <h2>Your learning journey</h2>
                <p>
                  Every attempt is a step forward.
                </p>
              </div>

              <button
                className="blurting-secondary"
                onClick={openHistory}
              >
                View history →
              </button>
            </div>

            {!data.sessions.length && (
              <div className="blurting-empty">
                <p>
                  Your completed sessions
                  will appear here.
                </p>
              </div>
            )}

            <div className="blurting-history-list">
              {[...data.sessions]
                .sort(
                  (a, b) =>
                    b.createdAt - a.createdAt
                )
                .slice(0, 3)
                .map((session) => (
                  <button
                    className="blurting-history-item"
                    key={session.id}
                    onClick={() =>
                      openSession(session)
                    }
                  >
                    <div>
                      <h3>{session.topicTitle}</h3>
                      <p>
                        {formatDate(session.createdAt)}
                        {" · "}
                        {session.wordCount} words
                      </p>
                    </div>

                    <strong>
                      {displayCoverage(
                        session.coverage
                      )}
                    </strong>
                  </button>
                ))}
            </div>
          </div>
        </>
      )}

      {/* ==================================
          CREATE / EDIT TOPIC
          ================================== */}

      {screen === "form" && (
        <>
          <div className="blurting-intro">
            <span className="blurting-kicker">
              YOUR KNOWLEDGE SPACE
            </span>

            <h1>
              {editingTopic
                ? "Refine your topic."
                : "Create a topic."}
            </h1>

            <p>
              Gather the knowledge
              you want to remember.
            </p>
          </div>

          <form
            className="blurting-form"
            onSubmit={handleSaveTopic}
          >

            <label htmlFor="blurting-title">
              Topic name
            </label>

            <input
              id="blurting-title"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              placeholder="e.g. Dynamic Programming"
              required
            />

            <label htmlFor="blurting-subject">
              Subject (optional)
            </label>

            <input
              id="blurting-subject"
              value={subject}
              onChange={(e) =>
                setSubject(e.target.value)
              }
              placeholder="e.g. Design and Analysis of Algorithms"
            />

            <label htmlFor="blurting-notes">
              Reference notes
            </label>

            <textarea
              id="blurting-notes"
              className="blurting-notes-input"
              value={notes}
              onChange={(e) =>
                setNotes(e.target.value)
              }
              placeholder="Paste or write your study notes here..."
              required
            />

            <label htmlFor="blurting-concepts">
              Key concepts (optional)
            </label>

            <textarea
              id="blurting-concepts"
              value={concepts}
              onChange={(e) =>
                setConcepts(e.target.value)
              }
              placeholder={
                "Overlapping subproblems\nOptimal substructure\nMemoization\nTabulation"
              }
            />

            <small>
              Separate concepts with commas
              or new lines. These will be used
              for automatic keyword comparison.
            </small>

            <div className="blurting-actions">
              <button className="blurting-primary">
                {editingTopic
                  ? "Save changes"
                  : "Create topic →"}
              </button>

              <button
                type="button"
                className="blurting-secondary"
                onClick={goDashboard}
              >
                Cancel
              </button>
            </div>

          </form>
        </>
      )}

      {/* ==================================
          STUDY SPACE
          ================================== */}

      {screen === "study" && activeTopic && (
        <>
          <div className="blurting-intro">
            <span className="blurting-kicker">
              {activeTopic.subject || "STUDY SPACE"}
            </span>

            <h1>{activeTopic.title}</h1>

            <p>
              Understand the material before
              beginning your recall session.
            </p>
          </div>

          <div className="blurting-study-notes">
            <h2>Reference notes</h2>

            <div className="blurting-note-content">
              {activeTopic.notes}
            </div>
          </div>

          {activeTopic.concepts.length > 0 && (
            <div className="blurting-section">
              <h2>Key concepts</h2>

              <div className="blurting-tags">
                {activeTopic.concepts.map((concept) => (
                  <span key={concept}>
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="blurting-section">
            <h2>Choose your recall time</h2>

            <p>
              Take your time, or challenge
              yourself with a countdown.
            </p>

            <div className="blurting-timer-options">
              {TIMER_OPTIONS.map((option) => (
                <button
                  className={`blurting-timer-option ${
                    timerMinutes === option.minutes
                      ? "selected"
                      : ""
                  }`}
                  key={option.minutes}
                  aria-pressed={
                    timerMinutes === option.minutes
                  }
                  onClick={() =>
                    setTimerMinutes(option.minutes)
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>

            <button
              className="blurting-primary"
              onClick={startRecall}
            >
              I'm ready — start recall →
            </button>

            <p className="blurting-hint">
              Your reference notes will be hidden
              during the session.
            </p>
          </div>

          {topicProgress &&
            topicProgress.totalSessions > 0 && (
              <div className="blurting-section">

                <h2>Your progress</h2>

                <div className="blurting-stats">
                  <div className="blurting-stat">
                    <span>Sessions</span>
                    <strong>
                      {topicProgress.totalSessions}
                    </strong>
                  </div>

                  <div className="blurting-stat">
                    <span>Latest coverage</span>
                    <strong>
                      {displayCoverage(
                        topicProgress.latestCoverage
                      )}
                    </strong>
                  </div>

                  <div className="blurting-stat">
                    <span>Best coverage</span>
                    <strong>
                      {displayCoverage(
                        topicProgress.bestCoverage
                      )}
                    </strong>
                  </div>

                  <div className="blurting-stat">
                    <span>Improvement</span>
                    <strong>
                      {topicProgress.improvement === null
                        ? "—"
                        : `${
                            topicProgress.improvement > 0
                              ? "+"
                              : ""
                          }${topicProgress.improvement} pp`}
                    </strong>
                  </div>
                </div>

                <div className="blurting-history-list">
                  {topicSessions.map((session) => (
                    <button
                      className="blurting-history-item"
                      key={session.id}
                      onClick={() =>
                        openSession(session)
                      }
                    >
                      <div>
                        <h3>
                          {formatDate(session.createdAt)}
                        </h3>

                        <p>
                          {session.wordCount} words
                          {" · "}
                          {formatTime(
                            session.durationSeconds
                          )}
                        </p>
                      </div>

                      <strong>
                        {displayCoverage(
                          session.coverage
                        )}
                      </strong>
                    </button>
                  ))}
                </div>

              </div>
            )}

        </>
      )}

      {/* ==================================
          RECALL WORKSPACE
          ================================== */}

      {screen === "recall" && sessionTopic && (
        <div className="blurting-recall">

          <div className="blurting-recall-top">
            <span className="blurting-kicker">
              ✧ ACTIVE RECALL SESSION
            </span>

            {timerMinutes > 0 && (
              <div
                className={`blurting-timer ${
                  timeLeft <= 30 ? "urgent" : ""
                }`}
              >
                ◷ {formatTime(timeLeft)}
              </div>
            )}
          </div>

          {timerMinutes > 0 && (
            <div className="blurting-progress">
              <div
                style={{
                  width: `${
                    (timeLeft / (timerMinutes * 60)) *
                    100
                  }%`,
                }}
              />
            </div>
          )}

          <div className="blurting-intro">
            <h1>What do you remember?</h1>

            <p>
              Topic: {sessionTopic.title}
            </p>
          </div>

          <div className="blurting-writing-area">

            <textarea
              aria-label="Write everything you remember"
              value={recall}
              onChange={(e) =>
                setRecall(e.target.value)
              }
              placeholder={
                "Let your thoughts flow...\n\nWrite everything you remember about this topic without looking at your notes."
              }
              autoFocus
              spellCheck={false}
            />

            <div className="blurting-writing-footer">
              <span>
                {countWords(recall)} words
              </span>

              <span>
                ✧ Reference notes hidden
              </span>
            </div>

          </div>

          <p className="blurting-hint">
            Don't worry about perfect sentences.
            Focus on what you can recall.
          </p>

          <button
            className="blurting-primary"
            onClick={finishRecall}
          >
            Finish & compare →
          </button>

        </div>
      )}

      {/* ==================================
          COMPARISON SCREEN
          ================================== */}

      {screen === "comparison" && sessionTopic && (
        <>
          <div className="blurting-intro">
            <span className="blurting-kicker">
              DISCOVER YOUR KNOWLEDGE
            </span>

            <h1>Let's see what stayed.</h1>

            <p>
              Compare your recall with
              the original reference material.
            </p>
          </div>

          <div className="blurting-compare-grid">

            <article className="blurting-compare-panel">
              <span className="blurting-kicker">
                ORIGINAL MATERIAL
              </span>

              <h2>Reference notes</h2>

              <div className="blurting-note-content">
                {sessionTopic.notes}
              </div>
            </article>

            <article className="blurting-compare-panel">
              <span className="blurting-kicker">
                FROM YOUR MEMORY
              </span>

              <h2>Your recall</h2>

              <div className="blurting-note-content">
                {recall.trim() ||
                  "No recall text was entered."}
              </div>

              <small>
                {countWords(recall)} words recalled
              </small>
            </article>

          </div>

          {renderComparison(comparison)}

          <div className="blurting-section">

            <h2>How well did you understand?</h2>

            <p>
              Look beyond keywords. Consider
              whether your explanations were accurate.
            </p>

            <div className="blurting-rating">

              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  className={`blurting-rating-button ${
                    selfRating === rating
                      ? "selected"
                      : ""
                  }`}
                  key={rating}
                  aria-pressed={selfRating === rating}
                  aria-label={`Rate understanding ${rating} out of 5`}
                  onClick={() =>
                    setSelfRating(rating)
                  }
                >
                  {rating}
                </button>
              ))}

            </div>

            <div className="blurting-rating-labels">
              <span>Need more practice</span>
              <span>Very confident</span>
            </div>

            <div className="blurting-reflection">
              <label htmlFor="blurting-reflection">
                What should you revisit?
              </label>

              <textarea
                id="blurting-reflection"
                value={reflection}
                onChange={(e) =>
                  setReflection(e.target.value)
                }
                placeholder="Write down missing concepts, mistakes, or anything you want to improve..."
              />
            </div>

            <button
              className="blurting-primary"
              onClick={saveSession}
            >
              Save session →
            </button>

          </div>
        </>
      )}

      {/* ==================================
          SESSION RESULT
          ================================== */}

      {screen === "result" && selectedSession && (
        <div className="blurting-result">

          <span className="blurting-result-icon">
            ✧
          </span>

          <span className="blurting-kicker">
            SESSION COMPLETE
          </span>

          <h1>Knowledge grows with practice.</h1>

          <p>
            You made a little more room
            for knowledge today.
          </p>

          <div className="blurting-result-score">
            {displayCoverage(
              selectedSession.coverage
            )}
          </div>

          <p>Key concept coverage</p>

          <div className="blurting-stats">

            <div className="blurting-stat">
              <span>Words recalled</span>
              <strong>
                {selectedSession.wordCount}
              </strong>
            </div>

            <div className="blurting-stat">
              <span>Recall time</span>
              <strong>
                {formatTime(
                  selectedSession.durationSeconds
                )}
              </strong>
            </div>

            <div className="blurting-stat">
              <span>Self-assessment</span>
              <strong>
                {selectedSession.selfRating
                  ? `${selectedSession.selfRating}/5`
                  : "—"}
              </strong>
            </div>

          </div>

          <div className="blurting-actions">

            <button
              className="blurting-primary"
              onClick={goDashboard}
            >
              Return to dashboard →
            </button>

            <button
              className="blurting-secondary"
              onClick={() =>
                openTopic(selectedSession.topicId)
              }
            >
              Study again
            </button>

          </div>

        </div>
      )}

      {/* ==================================
          SESSION HISTORY
          ================================== */}

      {screen === "history" && (
        <>
          <div className="blurting-intro">
            <span className="blurting-kicker">
              YOUR LEARNING JOURNEY
            </span>

            <h1>Little steps forward.</h1>

            <p>
              Revisit your previous recall sessions.
            </p>
          </div>

          {!data.sessions.length && (
            <div className="blurting-empty">
              <span>✧</span>
              <h3>Your journey awaits.</h3>
              <p>No completed sessions yet.</p>
            </div>
          )}

          <div className="blurting-history-list">
            {[...data.sessions]
              .sort(
                (a, b) =>
                  b.createdAt - a.createdAt
              )
              .map((session) => (
                <button
                  className="blurting-history-item"
                  key={session.id}
                  onClick={() =>
                    openSession(session)
                  }
                >
                  <div>
                    <span className="blurting-kicker">
                      {session.subject || "GENERAL"}
                    </span>

                    <h3>{session.topicTitle}</h3>

                    <p>
                      {formatDate(session.createdAt)}
                      {" · "}
                      {session.wordCount} words
                      {" · "}
                      {formatTime(
                        session.durationSeconds
                      )}
                    </p>
                  </div>

                  <strong>
                    {displayCoverage(
                      session.coverage
                    )}
                  </strong>
                </button>
              ))}
          </div>
        </>
      )}

      {/* ==================================
          SAVED SESSION DETAILS
          ================================== */}

      {screen === "history-detail" &&
        selectedSession && (
          <>
            <div className="blurting-intro">
              <span className="blurting-kicker">
                SAVED RECALL SESSION
              </span>

              <h1>{selectedSession.topicTitle}</h1>

              <p>
                {formatDate(
                  selectedSession.createdAt
                )}
                {" · "}
                {formatTime(
                  selectedSession.durationSeconds
                )}
              </p>
            </div>

            <div className="blurting-compare-grid">

              <article className="blurting-compare-panel">
                <h2>Original reference</h2>

                <div className="blurting-note-content">
                  {selectedSession.referenceNotes}
                </div>
              </article>

              <article className="blurting-compare-panel">
                <h2>Your recall</h2>

                <div className="blurting-note-content">
                  {selectedSession.recall ||
                    "No recall text was entered."}
                </div>
              </article>

            </div>

            {renderComparison(selectedSession)}

            <div className="blurting-section">
              <h2>Your reflection</h2>

              <div className="blurting-study-notes">

                <p>
                  Self-assessment:{" "}
                  {selectedSession.selfRating
                    ? `${selectedSession.selfRating}/5`
                    : "Not rated"}
                </p>

                <div className="blurting-note-content">
                  {selectedSession.reflection ||
                    "No reflection was recorded."}
                </div>

              </div>
            </div>
          </>
        )}

    </section>
  );
}
