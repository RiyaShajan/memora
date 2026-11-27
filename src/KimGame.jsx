import { useEffect, useRef, useState } from "react";
import "./KimGame.css";
import { DIFFICULTIES, OBJECTS } from "./kimObjects";
import { checkAnswers, shuffle } from "./kimMatching";

const PRELOAD_TIMEOUT_MS = 3500;

function photoUrl(object) {
  return `${import.meta.env.BASE_URL}kim/${object.id}.jpg`;
}

// Resolves once the photo loads, fails, or the timeout passes, so a slow
// or missing image can never eat into the observation time or block the game.
function preload(object) {
  return new Promise((resolve) => {
    const image = new Image();
    const finish = () => resolve();
    image.onload = finish;
    image.onerror = finish;
    image.src = photoUrl(object);
    setTimeout(finish, PRELOAD_TIMEOUT_MS);
  });
}

function formatTime(totalSeconds) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function ObjectPhoto({ object }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="object-fallback" role="img" aria-label={object.name}>
        {object.emoji}
      </div>
    );
  }

  return (
    <img
      src={photoUrl(object)}
      alt={object.name}
      loading="eager"
      draggable="false"
      onError={() => setFailed(true)}
    />
  );
}

function KimGame({ onBack }) {
  const [phase, setPhase] = useState("intro"); // intro | loading | observe | recall | result
  const [difficulty, setDifficulty] = useState("medium");
  const [objects, setObjects] = useState([]);
  const [msLeft, setMsLeft] = useState(0);
  const [answer, setAnswer] = useState("");
  const [results, setResults] = useState({
    correct: [],
    missed: [],
    extras: [],
    score: 0,
  });

  const config = DIFFICULTIES[difficulty];
  const endTimeRef = useRef(0);
  const roundRef = useRef(0); // ignores a preload that finishes after the player left
  const textareaRef = useRef(null);

  // Wall-clock timer: stays accurate if the tab is throttled, and has no
  // state-setting side effects inside a state updater (which StrictMode flags).
  useEffect(() => {
    if (phase !== "observe") return;

    const tick = () => {
      const remaining = endTimeRef.current - Date.now();
      if (remaining <= 0) {
        setMsLeft(0);
        setPhase("recall");
      } else {
        setMsLeft(remaining);
      }
    };

    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [phase]);

  // Bring each new step into view and focus the answer box.
  useEffect(() => {
    window.scrollTo({ top: 0 });
    if (phase === "recall") textareaRef.current?.focus();
  }, [phase]);

  // Cancel any in-flight preload if the player leaves.
  useEffect(() => {
    return () => {
      roundRef.current += 1;
    };
  }, []);

  async function startGame() {
    const picked = shuffle(OBJECTS).slice(0, config.count);
    const round = ++roundRef.current;

    setObjects(picked);
    setAnswer("");
    setPhase("loading");

    await Promise.all(picked.map(preload));
    if (round !== roundRef.current) return;

    endTimeRef.current = Date.now() + config.seconds * 1000;
    setMsLeft(config.seconds * 1000);
    setPhase("observe");
  }

  function endObservationEarly() {
    setPhase("recall");
  }

  function submitAnswer() {
    if (!answer.trim()) return;
    setResults(checkAnswers(answer, objects));
    setPhase("result");
  }

  function handleKeyDown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      submitAnswer();
    }
  }

  function backToIntro() {
    roundRef.current += 1;
    setPhase("intro");
  }

  const secondsLeft = Math.ceil(msLeft / 1000);
  const progress = Math.max(0, Math.min(100, (msLeft / (config.seconds * 1000)) * 100));
  const total = objects.length;

  const verdict =
    results.score === 100
      ? "Perfect recall!"
      : results.score >= 70
        ? "Well done!"
        : results.score >= 40
          ? "Good effort!"
          : "Keep practising!";

  return (
    <section className="kim-game">
      <button className="kim-back" onClick={onBack}>
        ← Back to Memora
      </button>

      <div className="kim-heading">
        <span className="kim-eyebrow">✧ VISUAL MEMORY TRAINING</span>
        <h1>Kim's Game</h1>
        <p>Look closely. Every little detail matters.</p>
      </div>

      {phase === "intro" && (
        <div className="kim-panel">
          <div className="kim-symbol">✦</div>
          <h2>Ready to observe?</h2>
          <p>
            You'll see {config.count} everyday objects for {config.seconds}{" "}
            seconds. Pay attention to every object. Once the timer ends,
            they'll disappear and you'll recall what you saw.
          </p>

          <div className="kim-levels" role="group" aria-label="Difficulty">
            {Object.entries(DIFFICULTIES).map(([key, level]) => (
              <button
                key={key}
                type="button"
                className={`kim-level ${difficulty === key ? "active" : ""}`}
                aria-pressed={difficulty === key}
                onClick={() => setDifficulty(key)}
              >
                {level.label}
              </button>
            ))}
          </div>

          <div className="kim-stats">
            <div>
              <strong>{config.count}</strong>
              <span>Objects</span>
            </div>
            <div>
              <strong>{config.seconds}s</strong>
              <span>Time</span>
            </div>
            <div>
              <strong>100%</strong>
              <span>Goal</span>
            </div>
          </div>

          <button className="kim-primary" onClick={startGame}>
            Begin observation →
          </button>
        </div>
      )}

      {phase === "loading" && (
        <div className="kim-panel" role="status">
          <div className="kim-symbol kim-pulse">✦</div>
          <h2>Setting the stage…</h2>
          <p>Gathering your objects. The timer starts once they're ready.</p>
        </div>
      )}

      {phase === "observe" && (
        <>
          <div className="kim-timer" role="timer" aria-label="Observation time left">
            <span>✧ OBSERVATION TIME</span>
            <strong>{formatTime(secondsLeft)}</strong>
            <div className="kim-progress">
              <div style={{ width: `${progress}%` }} />
            </div>
          </div>

          <p className="kim-instruction">
            Remember as many objects as you can.
          </p>

          <div className="object-grid">
            {objects.map((item) => (
              <article className="object-card" key={item.id}>
                <ObjectPhoto object={item} />
                <span>{item.name}</span>
              </article>
            ))}
          </div>

          <button className="kim-secondary kim-skip" onClick={endObservationEarly}>
            I'm ready →
          </button>
        </>
      )}

      {phase === "recall" && (
        <div className="kim-panel recall-panel">
          <div className="kim-symbol">✎</div>
          <h2>What do you remember?</h2>
          <p>
            The objects have disappeared. Take your time and
            write down every object you can recall.
          </p>

          <label htmlFor="recall-answer">Your remembered objects</label>
          <textarea
            id="recall-answer"
            ref={textareaRef}
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Apple, camera, coffee mug..."
            rows={5}
          />

          <span className="kim-hint">
            Separate each object with a comma or a new line. Small typos and
            common names (like "watch" or "cup") are fine.
          </span>

          <button
            className="kim-primary"
            onClick={submitAnswer}
            disabled={!answer.trim()}
          >
            Check my memory →
          </button>
        </div>
      )}

      {phase === "result" && (
        <div className="kim-panel result-panel">
          <div className="kim-symbol">✧</div>
          <span className="kim-eyebrow">YOUR RESULTS · {config.label.toUpperCase()}</span>
          <h2>{verdict}</h2>

          <div className="score-circle">
            <strong>{results.score}%</strong>
            <span>
              {results.correct.length} / {total} recalled
            </span>
          </div>

          <div className="result-columns">
            <div>
              <h3>✓ Remembered ({results.correct.length})</h3>
              {results.correct.map((item) => (
                <span className="result-item" key={item.id}>
                  {item.name}
                </span>
              ))}
              {results.correct.length === 0 && (
                <span className="result-item">None this time.</span>
              )}
            </div>

            <div>
              <h3>✧ Missed ({results.missed.length})</h3>
              {results.missed.map((item) => (
                <span className="result-item" key={item.id}>
                  {item.name}
                </span>
              ))}
              {results.missed.length === 0 && (
                <span className="result-item">Nothing missed!</span>
              )}
            </div>
          </div>

          {results.extras.length > 0 && (
            <p className="kim-extras">
              Not in this round: {results.extras.join(", ")}
            </p>
          )}

          <button className="kim-primary" onClick={startGame}>
            Play again ↻
          </button>
          <button className="kim-secondary" onClick={backToIntro}>
            Change difficulty
          </button>
          <button className="kim-secondary" onClick={onBack}>
            Return to Memora
          </button>
        </div>
      )}
    </section>
  );
}

export default KimGame;
