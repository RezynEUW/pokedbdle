// src/lib/game/compareGuess.ts
import { Pokemon } from '@/types/pokemon';

export interface ComparisonResult {
  category: string;
  value: string;
  isCorrect: boolean;
  isPartiallyCorrect?: boolean;
  hint?: ' ↑' | ' ↓';
}

export type ComparisonResults = {
  [key: string]: ComparisonResult;
};

function getNumericHint(guessValue: number, targetValue: number): ' ↑' | ' ↓' {
    return guessValue > targetValue ? ' ↓' : ' ↑';
  }

// Helper to format evolution stage (e.g., "stage1" -> "Stage 1")
function formatEvolutionStage(stage: string): string {
  // If the stage string starts with "stage" (case insensitive), add a space
  if (stage.toLowerCase().startsWith('stage')) {
    const numberPart = stage.slice(5);
    return `Stage ${numberPart}`;
  }
  return stage;
}

export function compareGuess(guess: Pokemon, target: Pokemon): ComparisonResults {
  return {
    generation: {
      category: 'Generation',
      value: guess.generation,
      isCorrect: guess.generation === target.generation
    },
    types: {
      category: 'Types',
      value: guess.types.join('/'),
      isCorrect: areArraysEqual(guess.types, target.types),
      isPartiallyCorrect: hasCommonType(guess.types, target.types)
    },
    color: {
      category: 'Color',
      value: guess.color,
      isCorrect: guess.color === target.color
    },
    evolution: {
      category: 'Evolution Stage',
      value: formatEvolutionStage(guess.evolution_stage),
      isCorrect: guess.evolution_stage === target.evolution_stage
    },
    height: {
      category: 'Height',
      value: `${(guess.height / 10).toFixed(1)}m`,
      isCorrect: guess.height === target.height,
      hint: guess.height > target.height ? ' ↓' : ' ↑'
    },
    weight: {
      category: 'Weight',
      value: `${(guess.weight / 10).toFixed(1)}kg`,
      isCorrect: guess.weight === target.weight,
      hint: guess.weight > target.weight ? ' ↓' : ' ↑'
    },
    bst: {
        category: 'BST',
        value: guess.base_stat_total.toString(),
        isCorrect: guess.base_stat_total === target.base_stat_total,
        hint: guess.base_stat_total !== target.base_stat_total 
          ? getNumericHint(guess.base_stat_total, target.base_stat_total)
          : undefined
      },
    highestStat: {
      category: 'Highest Stat',
      value: guess.highest_stat || '-',
      isCorrect: guess.highest_stat === target.highest_stat
    }
  };
}

function areArraysEqual(arr1: string[], arr2: string[]): boolean {
  return arr1.length === arr2.length &&
         arr1.every(type => arr2.includes(type));
}

function hasCommonType(types1: string[], types2: string[]): boolean {
  return types1.some(type => types2.includes(type));
}

export default compareGuess;