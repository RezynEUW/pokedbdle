// src/types/game.ts
import { Pokemon } from './pokemon';

export interface GuessResult {
  category: string;
  value: string;
  isCorrect: boolean;
  isPartiallyCorrect?: boolean;
  hint?: '↑' | '↓';
}

export interface GameState {
  guesses: Pokemon[];
  guessResults: GuessResult[][];
  remainingGuesses: number;
  isComplete: boolean;
  isWon: boolean;
}

export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: Record<number, number>;
  lastPlayed: string;
}

export type { Pokemon };