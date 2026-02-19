import { useEffect, useState } from "react";
import { GameCard, type GameEntry } from "./GameCard";

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
          {games.map((g) => (
            <GameCard key={g.slug} game={g} />
          ))}
        </ul>
      </div>
    </main>
  );
}
