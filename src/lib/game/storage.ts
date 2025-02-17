// src/lib/game/storage.ts
import { GameState } from '@/types/game';
import { isNewDay } from './dailyPokemon';

const GAME_STATE_KEY = 'pokedle-game-state';
const LAST_PLAYED_KEY = 'pokedle-last-played';

export function saveGameState(gameState: GameState) {
  try {
    // Save the game state
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(gameState));
    
    // Update last played date
    localStorage.setItem(LAST_PLAYED_KEY, new Date().toISOString());
  } catch (error) {
    console.error('Error saving game state:', error);
  }
}

export function loadGameState(): GameState | null {
  try {
    // Check if it's a new day
    const lastPlayedDate = localStorage.getItem(LAST_PLAYED_KEY);
    if (isNewDay(lastPlayedDate ?? undefined)) {
      // Clear old game state if it's a new day
      localStorage.removeItem(GAME_STATE_KEY);
      return null;
    }

    // Load game state
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