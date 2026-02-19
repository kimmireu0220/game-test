import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export interface GameEntry {
  file: string;
  title: string;
  slug: string;
}

interface HomeProps {
  nickname: string;
  onNicknameChange: () => void;
}

export function Home({ nickname, onNicknameChange }: HomeProps) {
  const [games, setGames] = useState<GameEntry[]>([]);

  useEffect(() => {
    const base = import.meta.env.BASE_URL;
    fetch(`${base}manifest.json`)
      .then((r) => r.json())
      .then(setGames)
      .catch(() => setGames([]));
  }, []);

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", width: "100%", boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2rem 2rem 0", flexWrap: "wrap", gap: "0.5rem" }}>
        <h1 style={{ fontSize: "1.75rem", margin: 0 }}>미니게임 모음집</h1>
        <button
          type="button"
          onClick={onNicknameChange}
          style={{ fontSize: "0.85rem", padding: "0.35rem 0.6rem", background: "rgba(255,255,255,0.15)", color: "#aaa", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "6px", cursor: "pointer" }}
        >
          닉네임: {nickname}
        </button>
      </div>
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", padding: "2rem" }}>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "1rem", width: "100%", maxWidth: "400px" }}>
          {games.map((g) => {
            const base = import.meta.env.BASE_URL;
            const cardIcon =
              g.slug === "timing-game"
                ? `${base}games/timing-game/images/timing-game-icon.png`
                : g.slug === "updown-game"
                  ? `${base}games/updown-game/images/updown-game-icon.png`
                  : null;
            return (
              <li key={g.slug}>
                <Link
                  to={`/games/${g.slug}/`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "1.25rem 1.5rem",
                    fontSize: "1.25rem",
                    fontWeight: 500,
                    color: "#eee",
                    textDecoration: "none",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "12px",
                    transition: "background 0.2s, border-color 0.2s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.14)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                  }}
                >
                  {cardIcon && (
                    <img
                      src={cardIcon}
                      alt=""
                      style={{ width: "48px", height: "48px", objectFit: "contain", flexShrink: 0 }}
                    />
                  )}
                  <span>{g.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
