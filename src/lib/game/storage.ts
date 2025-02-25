// src/lib/game/storage.ts
import { GameState } from '@/types/game';

const GAME_STATE_KEY = 'pokedle-game-state';
const LAST_PLAYED_KEY = 'pokedle-last-played';
const GENERATIONS_KEY = 'pokedle-generations';

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

// Generation selection functions
export function getSelectedGenerations(): number[] {
  try {
    const saved = localStorage.getItem(GENERATIONS_KEY);
    return saved ? JSON.parse(saved) : Array.from({ length: 9 }, (_, i) => i + 1);
  } catch (error) {
    console.error('Error loading selected generations:', error);
    return Array.from({ length: 9 }, (_, i) => i + 1);
  }
}

export function saveSelectedGenerations(generations: number[]): void {
  try {
    // Ensure at least one generation is selected
    const validGens = generations.length > 0 ? 
      generations : 
      Array.from({ length: 9 }, (_, i) => i + 1);
      
    localStorage.setItem(GENERATIONS_KEY, JSON.stringify(validGens));
  } catch (error) {
    console.error('Error saving selected generations:', error);
  }
}

// Add function to check if generations have changed from last game
export function haveGenerationsChanged(currentGenerations: number[]): boolean {
  try {
    const lastGameState = loadGameState();
    if (!lastGameState) return false;
    
    const savedGenerationsJSON = localStorage.getItem('pokedle-last-generations');
    if (!savedGenerationsJSON) return false;
    
    const savedGenerations = JSON.parse(savedGenerationsJSON);
    
    // Check if arrays have the same elements (order doesn't matter)
    if (savedGenerations.length !== currentGenerations.length) return true;
    
    const sortedSaved = [...savedGenerations].sort();
    const sortedCurrent = [...currentGenerations].sort();
    
    return !sortedSaved.every((gen, i) => gen === sortedCurrent[i]);
  } catch (error) {
    console.error('Error checking generation changes:', error);
    return false;
  }
}

// Save the generations used for the current game
export function saveGameGenerations(generations: number[]): void {
  try {
    localStorage.setItem('pokedle-last-generations', JSON.stringify(generations));
  } catch (error) {
    console.error('Error saving game generations:', error);
  }
}