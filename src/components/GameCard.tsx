import { useState } from "react";
import { Link } from "react-router-dom";

export interface GameEntry {
  file: string;
  title: string;
  slug: string;
  icon?: string;
  description?: string;
}

const CARD_SIZE = 160;

const cardLinkStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.75rem",
  width: CARD_SIZE,
  height: CARD_SIZE,
  padding: "1rem",
  fontSize: "1rem",
  fontWeight: 500,
  color: "#eee",
  textDecoration: "none",
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: "12px",
  transition: "background 0.2s, border-color 0.2s",
  boxSizing: "border-box",
};

const infoBtnStyle: React.CSSProperties = {
  position: "absolute",
  top: 4,
  right: 10,
  minWidth: 44,
  minHeight: 44,
  width: 44,
  height: 44,
  padding: 0,
  border: "none",
  background: "transparent",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 2,
};

interface GameCardProps {
  game: GameEntry;
  /** 그리드 셀 안에서 쓸 때 div로 렌더 (기본 li) */
  as?: "li" | "div";
}

const DEFAULT_ICON = "images/surprise-box.png";

export function GameCard({ game, as: Wrapper = "li" }: GameCardProps) {
  const [showInfo, setShowInfo] = useState(false);
  const base = import.meta.env.BASE_URL;
  const iconUrl = game.icon ? `${base}${game.icon}` : `${base}${DEFAULT_ICON}`;
  const description = game.description ?? "설명이 없습니다.";

  return (
    <Wrapper style={{ position: "relative" } as React.CSSProperties}>
      <button
        type="button"
        aria-label="게임 설명"
        style={infoBtnStyle}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowInfo(true);
        }}
      >
        <img
          src={`${import.meta.env.BASE_URL}images/info-icon.png`}
          alt=""
          style={{ width: 24, height: 24, objectFit: "contain", display: "block" }}
        />
      </button>
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
        <img
          src={iconUrl}
          alt=""
          style={{ width: 44, height: 44, objectFit: "contain", flexShrink: 0 }}
        />
        <span style={{ textAlign: "center", lineHeight: 1.3 }}>{game.title}</span>
      </Link>
      {showInfo && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(4px)",
              WebkitBackdropFilter: "blur(4px)",
              zIndex: 100,
            }}
            onClick={() => setShowInfo(false)}
          />
          <div
            style={{
              position: "fixed",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: "90%",
              maxWidth: 340,
              padding: "1.75rem 1.5rem",
              paddingTop: "1rem",
              background: "linear-gradient(160deg, #1e2235 0%, #161a2b 50%, #13162a 100%)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 20,
              boxShadow: "0 24px 48px rgba(0,0,0,0.45), 0 0 0 1px rgba(127,200,168,0.08) inset",
              zIndex: 101,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1rem",
                paddingBottom: "0.75rem",
                borderBottom: "1px solid rgba(127,200,168,0.25)",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  color: "#fff",
                }}
              >
                {game.title}
              </h3>
              <button
                type="button"
                aria-label="닫기"
                onClick={() => setShowInfo(false)}
                style={{
                  minWidth: 44,
                  minHeight: 44,
                  width: 44,
                  height: 44,
                  padding: 0,
                  border: "none",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.12)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <img
                  src={`${import.meta.env.BASE_URL}images/close-icon.png`}
                  alt=""
                  style={{ width: 20, height: 20, objectFit: "contain", display: "block" }}
                />
              </button>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: "0.9rem",
                lineHeight: 1.8,
                color: "rgba(255,255,255,0.82)",
                whiteSpace: "pre-line",
                letterSpacing: "0.01em",
              }}
            >
              {description}
            </p>
          </div>
        </>
      )}
    </Wrapper>
  );
}
