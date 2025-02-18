// src/lib/game/storage.ts
import { GameState } from '@/types/game';

const GAME_STATE_KEY = 'pokedle-game-state';
const LAST_PLAYED_KEY = 'pokedle-last-played';

// Local function definition
function isNewDay(lastPlayedDate?: string | null): boolean {
  if (!lastPlayedDate) return true;

  const today = new Date();
  const lastPlayed = new Date(lastPlayedDate);

  return (
    today.getFullYear() !== lastPlayed.getFullYear() ||
    today.getMonth() !== lastPlayed.getMonth() ||
    today.getDate() !== lastPlayed.getDate()
  );
}

export function saveGameState(gameState: GameState) {
  try {
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(gameState));
    localStorage.setItem(LAST_PLAYED_KEY, new Date().toISOString());
  } catch (error) {
    console.error('Error saving game state:', error);
  }
}

export function loadGameState(): GameState | null {
  try {
    const lastPlayedDate = localStorage.getItem(LAST_PLAYED_KEY);
    if (isNewDay(lastPlayedDate)) {
      localStorage.removeItem(GAME_STATE_KEY);
      return null;
    }

    const savedState = localStorage.getItem(GAME_STATE_KEY);
    return savedState ? JSON.parse(savedState) : null;
  } catch (error) {
    console.error('Error loading game state:', error);
    return null;
  }
}

export function clearGameState() {
  try {
    localStorage.removeItem(GAME_STATE_KEY);
    localStorage.removeItem(LAST_PLAYED_KEY);
  } catch (error) {
    console.error('Error clearing game state:', error);
  }
}