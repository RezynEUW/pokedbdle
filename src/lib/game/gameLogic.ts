// src/lib/game/gameLogic.ts
import { Pokemon, HintResult, GuessResult } from "@/types/game";

export function compareGuess(guess: Pokemon, target: Pokemon): GuessResult {
  const hints: HintResult[] = [
    compareTypes(guess.types, target.types),
    compareGeneration(guess.generation, target.generation),
    compareColor(guess.color, target.color),
    compareEvolutionStage(guess.evolution_stage, target.evolution_stage),
    compareHeight(guess.height, target.height),
    compareWeight(guess.weight, target.weight),
    compareBST(guess.bst, target.bst),
    compareHighestStat(guess.highest_stat, target.highest_stat),
    compareAbilities(guess.abilities, target.abilities),
    compareEggGroups(guess.egg_groups, target.egg_groups)
  ];

  return {
    pokemon: guess,
    hints,
    isCorrect: hints.every(hint => hint.isCorrect)
  };
}

function compareTypes(guessTypes: string[], targetTypes: string[]): HintResult {
  const normalizedGuessTypes = guessTypes.filter(Boolean);
  const normalizedTargetTypes = targetTypes.filter(Boolean);
  
  if (JSON.stringify(normalizedGuessTypes.sort()) === JSON.stringify(normalizedTargetTypes.sort())) {
    return {
      category: "Types",
      value: normalizedGuessTypes.join('/'),
      isCorrect: true
    };
  }
  
  const matchedTypes = normalizedGuessTypes.filter(type => normalizedTargetTypes.includes(type));
  return {
    category: "Types",
    value: normalizedGuessTypes.join('/'),
    isCorrect: false,
    isPartiallyCorrect: matchedTypes.length > 0
  };
}

function compareGeneration(guessGeneration: string, targetGeneration: string): HintResult {
  return {
    category: "Generation",
    value: guessGeneration,
    isCorrect: guessGeneration === targetGeneration
  };
}

function compareColor(guessColor: string, targetColor: string): HintResult {
  return {
    category: "Color",
    value: guessColor,
    isCorrect: guessColor === targetColor
  };
}

function compareEvolutionStage(guessStage: string, targetStage: string): HintResult {
  return {
    category: "Evolution Stage",
    value: guessStage,
    isCorrect: guessStage === targetStage
  };
}

function compareHeight(guessHeight: number, targetHeight: number): HintResult {
  if (guessHeight === targetHeight) {
    return {
      category: "Height",
      value: `${guessHeight} dm`,
      isCorrect: true
    };
  }
  const isClose = Math.abs(guessHeight - targetHeight) / targetHeight <= 0.1;
  return {
    category: "Height",
    value: `${guessHeight} dm`,
    isCorrect: false,
    isPartiallyCorrect: isClose,
    comparison: guessHeight > targetHeight ? 'above' : 'below'
  };
}

function compareWeight(guessWeight: number, targetWeight: number): HintResult {
  if (guessWeight === targetWeight) {
    return {
      category: "Weight",
      value: `${guessWeight} hg`,
      isCorrect: true
    };
  }
  const isClose = Math.abs(guessWeight - targetWeight) / targetWeight <= 0.1;
  return {
    category: "Weight",
    value: `${guessWeight} hg`,
    isCorrect: false,
    isPartiallyCorrect: isClose,
    comparison: guessWeight > targetWeight ? 'above' : 'below'
  };
}

function compareBST(guessBST: number, targetBST: number): HintResult {
  return {
    category: "Base Stat Total",
    value: guessBST.toString(),
    isCorrect: guessBST === targetBST
  };
}

function compareHighestStat(guessHighest: string, targetHighest: string): HintResult {
  return {
    category: "Highest Stat",
    value: guessHighest,
    isCorrect: guessHighest === targetHighest
  };
}

function compareAbilities(guessAbilities: string[], targetAbilities: string[]): HintResult {
  const normalizedGuess = guessAbilities.slice().sort();
  const normalizedTarget = targetAbilities.slice().sort();

  if (JSON.stringify(normalizedGuess) === JSON.stringify(normalizedTarget)) {
    return {
      category: "Abilities",
      value: normalizedGuess.join(', '),
      isCorrect: true
    };
  }
  
  const matched = normalizedGuess.filter(ability => normalizedTarget.includes(ability));
  return {
    category: "Abilities",
    value: normalizedGuess.join(', '),
    isCorrect: false,
    isPartiallyCorrect: matched.length > 0
  };
}

function compareEggGroups(guessEggGroups: string[], targetEggGroups: string[]): HintResult {
  const normalizedGuess = guessEggGroups.slice().sort();
  const normalizedTarget = targetEggGroups.slice().sort();

  if (JSON.stringify(normalizedGuess) === JSON.stringify(normalizedTarget)) {
    return {
      category: "Egg Groups",
      value: normalizedGuess.join(', '),
      isCorrect: true
    };
  }
  
  const matched = normalizedGuess.filter(egg => normalizedTarget.includes(egg));
  return {
    category: "Egg Groups",
    value: normalizedGuess.join(', '),
    isCorrect: false,
    isPartiallyCorrect: matched.length > 0
  };
}
