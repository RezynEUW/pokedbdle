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

function compareArrays(array1: string[] = [], array2: string[] = []): {
  isCorrect: boolean;
  isPartiallyCorrect: boolean;
} {
  const normalized1 = array1.map(item => item?.toLowerCase()).filter(Boolean);
  const normalized2 = array2.map(item => item?.toLowerCase()).filter(Boolean);

  const hasAllItems = normalized1.length === normalized2.length &&
    normalized1.every(item => normalized2.includes(item));
  
  const hasAnyItem = normalized1.some(item => normalized2.includes(item));

  return {
    isCorrect: hasAllItems,
    isPartiallyCorrect: !hasAllItems && hasAnyItem
  };
}

export function compareGuess(guess: Pokemon, target: Pokemon): ComparisonResults {
  const eggGroupComparison = compareArrays(
    guess?.egg_groups || [], 
    target?.egg_groups || []
  );

  const abilityComparison = compareArrays(
    guess?.abilities || [], 
    target?.abilities || []
  );

  const typeComparison = compareArrays(
    guess?.types || [], 
    target?.types || []
  );

  const highestStatComparison = compareArrays(
    guess?.highest_stats || [], 
    target?.highest_stats || []
  );

  return {
    generation: {
      category: 'Generation',
      value: guess.generation || '-',
      isCorrect: guess.generation === target.generation
    },
    types: {
      category: 'Types',
      value: (guess?.types || []).join('/') || '-',
      isCorrect: typeComparison.isCorrect,
      isPartiallyCorrect: typeComparison.isPartiallyCorrect
    },
    color: {
      category: 'Color',
      value: guess.color || '-',
      isCorrect: guess.color === target.color
    },
    evolution: {
      category: 'Evolution Stage',
      value: guess.evolution_stage ? guess.evolution_stage.replace('stage', 'Stage ') : '-',
      isCorrect: guess.evolution_stage === target.evolution_stage
    },
    height: {
      category: 'Height',
      value: guess.height ? `${(guess.height / 10).toFixed(1)}m` : '-',
      isCorrect: guess.height === target.height,
      hint: guess.height !== target.height ? getNumericHint(guess.height, target.height) : undefined
    },
    weight: {
      category: 'Weight',
      value: guess.weight ? `${(guess.weight / 10).toFixed(1)}kg` : '-',
      isCorrect: guess.weight === target.weight,
      hint: guess.weight !== target.weight ? getNumericHint(guess.weight, target.weight) : undefined
    },
    bst: {
      category: 'BST',
      value: guess.base_stat_total?.toString() || '-',
      isCorrect: guess.base_stat_total === target.base_stat_total,
      hint: guess.base_stat_total !== target.base_stat_total ? 
        getNumericHint(guess.base_stat_total, target.base_stat_total) : undefined
    },
    highestStat: {
        category: 'Highest Stat',
        value: (guess?.highest_stats || []).join(', ') || '-',
        isCorrect: highestStatComparison.isCorrect,
        isPartiallyCorrect: highestStatComparison.isPartiallyCorrect
      },
    abilities: {
      category: 'Abilities',
      value: (guess?.abilities || []).join(', ') || '-',
      isCorrect: abilityComparison.isCorrect,
      isPartiallyCorrect: abilityComparison.isPartiallyCorrect
    },
    eggGroups: {
      category: 'Egg Groups',
      value: (guess?.egg_groups || []).join(', ') || '-',
      isCorrect: eggGroupComparison.isCorrect,
      isPartiallyCorrect: eggGroupComparison.isPartiallyCorrect
    }
  };
}

export default compareGuess;