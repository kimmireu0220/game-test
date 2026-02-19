import { Link } from "react-router-dom";

export interface GameEntry {
  file: string;
  title: string;
  slug: string;
}

function getCardIconUrl(slug: string): string | null {
  const base = import.meta.env.BASE_URL;
  if (slug === "timing-game") return `${base}games/timing-game/images/timing-game-icon.png`;
  if (slug === "updown-game") return `${base}games/updown-game/images/updown-game-icon.png`;
  return null;
}

const cardLinkStyle: React.CSSProperties = {
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
};

interface GameCardProps {
  game: GameEntry;
}

export function GameCard({ game }: GameCardProps) {
  const iconUrl = getCardIconUrl(game.slug);

  return (
    <li>
      <Link
        to={`/games/${game.slug}/`}
        style={cardLinkStyle}
        onMouseOver={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.14)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.08)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
        }}
      >
        {iconUrl && (
          <img
            src={iconUrl}
            alt=""
            style={{ width: "48px", height: "48px", objectFit: "contain", flexShrink: 0 }}
          />
        )}
        <span>{game.title}</span>
      </Link>
    </li>
  );
}
