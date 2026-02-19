import { useParams } from "react-router-dom";
import { GameLayout } from "./GameLayout";

export function GamePage() {
  const { slug } = useParams<{ slug: string }>();

  if (!slug) return null;

  const base = import.meta.env.BASE_URL;
  const iframeSrc = `${base}games/${slug}/index.html`;

  return <GameLayout slug={slug} iframeSrc={iframeSrc} />;
}
