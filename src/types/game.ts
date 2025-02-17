// src/types/game.ts
export interface Pokemon {
    id: number;
    name: string;
    generation: string;
    types: string[];
    color: string;
    evolution_stage: string;
    height: number;
    weight: number;
    bst: number;
    highest_stat: string;
    abilities: string[];
    egg_groups: string[];
    sprite_official: string;
    sprite_thumbnail: string;
  }
  
  
  export interface HintResult {
    category: string;
    value: string;
    isCorrect: boolean;
    isPartiallyCorrect?: boolean;
    comparison?: 'above' | 'below' | null;
  }
  
  export interface GuessResult {
    pokemon: Pokemon;
    hints: HintResult[];
    isCorrect: boolean;
  }
  
  export interface GameStats {
    gamesPlayed: number;
    gamesWon: number;
    currentStreak: number;
    maxStreak: number;
    guessDistribution: Record<number, number>;
  }