// src/components/game/GuessRow.tsx
import React from 'react';
import { Pokemon } from '@/types/pokemon';
import { GuessResult } from '@/types/game';

interface GuessRowProps {
  pokemon: Pokemon;
  results: GuessResult[];
}

export function GuessRow({ pokemon, results }: GuessRowProps) {
  const renderResultCell = (result: GuessResult) => {
    const bgColor = result.isCorrect 
      ? 'bg-green-200' 
      : result.isPartiallyCorrect 
        ? 'bg-yellow-200' 
        : 'bg-red-200';

    return (
      <div className={`
        p-2 border rounded flex items-center justify-between
        ${bgColor} transition-colors duration-300
      `}>
        <span className="font-medium">{result.value}</span>
        {result.hint && (
          <span className="text-sm font-bold ml-2">
            {result.hint}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-[auto_repeat(7,1fr)] gap-2">
      <div className="w-16 h-16 border rounded overflow-hidden bg-white">
        <img 
          src={pokemon.sprite_default} 
          alt={pokemon.name}
          className="w-full h-full object-contain"
        />
      </div>
      <div className="contents">
        {results.map((result, j) => (
          <div key={`${pokemon.name}-${j}`}>
            {renderResultCell(result)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default GuessRow;