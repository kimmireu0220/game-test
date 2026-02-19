import { Routes, Route } from "react-router-dom";
import { HomeGate } from "./components/HomeGate";
import { GamePage } from "./components/GamePage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeGate />} />
      <Route path="/games/:slug/*" element={<GamePage />} />
    </Routes>
  );
}
