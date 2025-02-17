// src/components/game/GuessHints.tsx
'use client';

import Image from 'next/image';
import type { Pokemon, HintResult } from "@/types/game";

interface GuessHintsProps {
  guesses: Pokemon[];
  className?: string;
}

export function GuessHints({ guesses = [], className = '' }: GuessHintsProps) {
  // Updated categories (removed habitat, added new ones)
  const categories = [
    "Type 1",
    "Type 2",
    "Color",
    "Evolution Stage",
    "Height",
    "Weight",
    "Generation",
    "Abilities",
    "Egg Groups",
    "Base Stat Total",
    "Highest Stat"
  ];

  return (
    <div className={`overflow-x-auto ${className}`}>
      <div className="grid grid-cols-12 gap-1 text-center">
        {/* Header row */}
        <div></div>
        {categories.map((category) => (
          <div key={category} className="font-bold text-sm">{category}</div>
        ))}

        {/* For each guess, display the Pokémon sprite and attribute values */}
        {guesses.map((guess) => (
          <div key={guess.id} className="contents">
            <div>
              <Image 
                src={guess.sprite_official} 
                alt={guess.name} 
                width={50} 
                height={50} 
                className="w-12 h-12 object-contain"
              />
            </div>
            {renderAttribute(guess.types[0] || 'N/A', 'Type 1')}
            {renderAttribute(guess.types[1] || 'N/A', 'Type 2')}
            {renderAttribute(guess.color, 'Color')}
            {renderAttribute(guess.evolution_stage, 'Evolution Stage')}
            {renderAttribute(`${guess.height} dm`, 'Height')}
            {renderAttribute(`${guess.weight} hg`, 'Weight')}
            {renderAttribute(guess.generation, 'Generation')}
            {renderAttribute(guess.abilities.join(', '), 'Abilities')}
            {renderAttribute(guess.egg_groups.join(', '), 'Egg Groups')}
            {renderAttribute(guess.bst.toString(), 'Base Stat Total')}
            {renderAttribute(guess.highest_stat, 'Highest Stat')}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderAttribute(value: string, category: string) {
  // Placeholder: You can implement detailed logic based on HintResult data
  let bgClass = 'bg-yellow-200';
  if (
    category === 'Type 1' ||
    category === 'Type 2' ||
    category === 'Generation' ||
    category === 'Color' ||
    category === 'Evolution Stage'
  ) {
    bgClass = 'bg-green-200';
  }
  return (
    <div className={`p-1 font-semibold ${bgClass}`}>
      {value}
    </div>
  );
}
