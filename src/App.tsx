import { Routes, Route, Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

const NICKNAME_KEY = "mini_game_nickname";

interface GameEntry {
  file: string;
  title: string;
  slug: string;
}

function getStoredNickname(): string {
  try {
    return localStorage.getItem(NICKNAME_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

function NicknameScreen({ onDone }: { onDone: () => void }) {
  const [value, setValue] = useState(getStoredNickname());
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nick = value.trim();
    if (!nick) {
      setError("닉네임을 입력해 주세요.");
      return;
    }
    if (nick.length > 20) {
      setError("닉네임은 20자 이내로 입력해 주세요.");
      return;
    }
    setError("");
    try {
      localStorage.setItem(NICKNAME_KEY, nick);
    } catch {}
    onDone();
  };

  return (
    <main style={{ padding: "2rem", maxWidth: "400px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.75rem", marginBottom: "1.5rem" }}>미니게임 모음집</h1>
      <p style={{ color: "#aaa", marginBottom: "1.25rem", fontSize: "0.95rem" }}>
        게임에 사용할 닉네임을 입력하세요. (한 번만 설정됩니다)
      </p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="app-nickname" style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
          닉네임
        </label>
        <input
          id="app-nickname"
          type="text"
          maxLength={20}
          placeholder="닉네임 입력"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: "8px",
            background: "rgba(255,255,255,0.08)",
            color: "#eee",
            fontSize: "1rem",
            marginBottom: "0.5rem",
          }}
        />
        {error && <p style={{ color: "#e88", fontSize: "0.9rem", marginBottom: "0.5rem" }}>{error}</p>}
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "12px",
            background: "#4a7c59",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          시작하기
        </button>
      </form>
    </main>
  );
}

function Home({ nickname, onNicknameChange }: { nickname: string; onNicknameChange: () => void }) {
  const [games, setGames] = useState<GameEntry[]>([]);

  useEffect(() => {
    const base = import.meta.env.BASE_URL;
    fetch(`${base}manifest.json`)
      .then((r) => r.json())
      .then(setGames)
      .catch(() => setGames([]));
  }, []);

  return (
    <main style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <h1 style={{ fontSize: "1.75rem", margin: 0 }}>미니게임 모음집</h1>
        <button
          type="button"
          onClick={onNicknameChange}
          style={{ fontSize: "0.85rem", padding: "0.35rem 0.6rem", background: "rgba(255,255,255,0.15)", color: "#aaa", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "6px", cursor: "pointer" }}
        >
          닉네임: {nickname}
        </button>
      </div>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {games.map((g) => (
          <li key={g.slug} style={{ marginBottom: "1rem" }}>
            <Link
              to={`/games/${g.slug}/`}
              style={{ fontSize: "1.35rem", display: "inline-block", padding: "0.5rem 0" }}
            >
              {g.title}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

function GamePage() {
  const { slug } = useParams<{ slug: string }>();

  if (!slug) return null;

  return (
    <main style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <iframe
        title={slug}
        src={`${import.meta.env.BASE_URL}games/${slug}/index.html`}
        style={{ flex: 1, border: "none", width: "100%" }}
      />
    </main>
  );
}

function HomeGate() {
  const [nickname, setNickname] = useState<string>(() => getStoredNickname());

  const handleNicknameDone = () => setNickname(getStoredNickname());
  const handleNicknameChange = () => {
    try {
      localStorage.removeItem(NICKNAME_KEY);
    } catch {}
    setNickname("");
  };

  if (!nickname) return <NicknameScreen onDone={handleNicknameDone} />;
  return <Home nickname={nickname} onNicknameChange={handleNicknameChange} />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeGate />} />
      <Route path="/games/:slug/*" element={<GamePage />} />
    </Routes>
  );
}
