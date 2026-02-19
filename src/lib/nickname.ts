export const NICKNAME_KEY = "mini_game_nickname";

export function getStoredNickname(): string {
  try {
    return localStorage.getItem(NICKNAME_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}
