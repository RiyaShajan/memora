
import { useState } from "react";
import "./App.css";
import KimGame from "./KimGame";
import Leitner from "./Leitner";
import Blurting from "./Blurting";

const games = [
  {
    number: "01",
    icon: "✦",
    name: "Kim's Game",
    subtitle: "Observe. Remember. Recall.",
    description:
      "Train your visual memory by observing objects and recalling every detail.",
    duration: "2–5 min",
    color: "lavender",
  },
  {
    number: "02",
    icon: "▤",
    name: "Leitner System",
    subtitle: "Remember what matters.",
    description:
      "Master spaced repetition with flashcards that adapt to your progress.",
    duration: "5–10 min",
    color: "blue",
  },
  {
    number: "03",
    icon: "✎",
    name: "Blurting Method",
    subtitle: "Think. Write. Discover.",
    description:
      "Recall everything you know about a topic without looking at your notes.",
    duration: "5–15 min",
    color: "green",
  },
];

function App() {
  const [dark, setDark] = useState(true);
  const [activeGame, setActiveGame] = useState(null);

  function openGame(gameNumber) {
    if (gameNumber === "01") {
      setActiveGame("kim");
    } else if (gameNumber === "02") {
      setActiveGame("leitner");
    } else if (gameNumber === "03") {
      setActiveGame("blurting");
    }
  }
  function closeGame() {
    setActiveGame(null);
  }

  // KIM'S GAME

  if (activeGame === "kim") {
    return (
      <main className={dark ? "app night" : "app day"}>
        <KimGame onBack={closeGame} />
      </main>
    );
  }

  // LEITNER SYSTEM

  if (activeGame === "leitner") {
    return (
      <main className={dark ? "app night" : "app day"}>
        <Leitner onBack={closeGame} />
      </main>
    );
  }
  // BLURTING METHOD

  if (activeGame === "blurting") {
  return (
    <main className={dark ? "app night" : "app day"}>
      <Blurting onBack={closeGame} />
    </main>
  );
}

  // MEMORA HOMEPAGE

  return (
    <main className={dark ? "app night" : "app day"}>
      <div className="sky-decoration" aria-hidden="true">
        <span className="star star-one">✦</span>
        <span className="star star-two">✧</span>
        <span className="star star-three">·</span>
        <span className="star star-four">✦</span>
        <span className="star star-five">✧</span>
      </div>

      <header className="navbar">
        <a className="brand" href="#">
          <span className="brand-icon">✧</span>
          <span>
            memora<span className="brand-dot">.</span>
          </span>
        </a>

        <nav className="nav-links">
          <a href="#home">Home</a>
          <a href="#training">Training</a>
          <a href="#about">About</a>
        </nav>

        <div className="nav-actions">
          <button
            className="theme-toggle"
            onClick={() => setDark(!dark)}
            aria-label="Switch theme"
          >
            <span>{dark ? "☀" : "☾"}</span>
            <span className="toggle-label">
              {dark ? "Day mode" : "Night mode"}
            </span>
          </button>

          <button className="login-button">
            Sign in ↗
          </button>
        </div>
      </header>

      <section className="hero" id="home">
        <div className="hero-content">
          <div className="eyebrow">
            <span className="pulse-dot"></span>
            YOUR PERSONAL MEMORY UNIVERSE
          </div>

          <h1>
            Make room for
            <br />
            <span className="hero-highlight">
              wonderful
            </span>{" "}
            memories.
          </h1>

          <p className="hero-description">
            Your mind is capable of more than you imagine.
            Explore simple techniques, strengthen your recall,
            and discover what your memory can do.
          </p>

          <a className="primary-button" href="#training">
            Explore your mind <span>→</span>
          </a>

          <div className="hero-note">
            ✧ A little progress every day goes a long way.
          </div>
        </div>

        <div className="hero-art">
          <div className="orbit orbit-one"></div>
          <div className="orbit orbit-two"></div>

          <div className="moon">
            <div className="moon-crater crater-one"></div>
            <div className="moon-crater crater-two"></div>
            <div className="moon-crater crater-three"></div>
          </div>

          <span className="orbit-star">✦</span>
          <span className="orbit-star second">✧</span>
          <span className="orbit-star third">·</span>

          <div className="art-caption">
            <span>01 — DISCOVER</span>
            <span>Your universe awaits</span>
          </div>
        </div>
      </section>

      <section className="training-section" id="training">
        <div className="section-heading">
          <div>
            <span className="section-kicker">
              YOUR TRAINING SPACE
            </span>

            <h2>Explore your memory.</h2>

            <p>
              Three little ways to give your brain a workout.
            </p>
          </div>

          <span className="section-decoration">✧</span>
        </div>

        <div className="game-grid">
          {games.map((game) => (
            <article
              className={`game-card ${game.color}`}
              key={game.number}
            >
              <div className="card-top">
                <span className="card-number">
                  {game.number} / 03
                </span>

                <span className="card-icon">
                  {game.icon}
                </span>
              </div>

              <div className="card-content">
                <h3>{game.name}</h3>

                <span className="card-subtitle">
                  {game.subtitle}
                </span>

                <p>{game.description}</p>
              </div>

              <div className="card-bottom">
                <span className="duration">
                  ◷ {game.duration}
                </span>

                <button
                  className="card-button"
                  onClick={() => openGame(game.number)}
                >
                  Explore →
                </button>
              </div>
            </article>
          ))}
        </div>

      </section>

      <footer id="about">
        <span>✧ made for curious minds.</span>
        <span>MEMORA © 2026</span>
      </footer>
    </main>
  );
}

export default App;
