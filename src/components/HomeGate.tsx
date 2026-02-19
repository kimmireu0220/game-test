import { useState } from "react";
import { getStoredNickname, NICKNAME_KEY } from "../lib/nickname";
import { NicknameScreen } from "./NicknameScreen";
import { Home } from "./Home";

export function HomeGate() {
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
