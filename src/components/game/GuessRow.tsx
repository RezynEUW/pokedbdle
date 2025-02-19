// src/components/game/GuessRow.tsx
import React from 'react';
import { Pokemon } from '@/types/pokemon';
import { GuessResult } from '@/types/game';

interface GuessRowProps {
  pokemon: Pokemon;
  results: GuessResult[];
  guessNumber?: number;
}

export function GuessRow({ pokemon, results, guessNumber }: GuessRowProps) {
  const getCardClassName = (result: GuessResult) => {
    if (result.isCorrect) {
      return 'stat-card correct';
    } else if (result.isPartiallyCorrect) {
      return 'stat-card partial';
    } else {
      return 'stat-card incorrect';
    }
  };

  const renderResultCell = (result: GuessResult, index: number) => {
    // Determine result type based on index
    const categories = ['type', 'generation', 'color', 'evolution', 'height', 'weight', 'bst', 'eggGroup', 'ability'];
    const category = categories[index] || 'unknown';
    
    // Special rendering for types
    if (category === 'type') {
      // Apply status class to type card
      const statusClass = result.isCorrect 
        ? 'correct' 
        : result.isPartiallyCorrect 
          ? 'partial' 
          : 'incorrect';
      
      return (
        <div className={`stat-card type-card ${statusClass}`}>
          <div className="type-icons">
            {Array.isArray(result.value) ? (
              result.value.map((type, idx) => (
                <img 
                  key={idx}
                  src={`/types/${type.toLowerCase()}.png`} 
                  alt={type}
                  className="type-icon"
                />
              ))
            ) : (
              <img 
                src={`/types/${String(result.value).toLowerCase()}.png`} 
                alt={String(result.value)}
                className="type-icon"
              />
            )}
          </div>
        </div>
      );
    }

    // Special rendering for numeric values with arrows
    if (['height', 'weight', 'bst'].includes(category) && result.hint) {
      return (
        <div className={getCardClassName(result)}>
          <div className="value-with-arrow">
            <span>{result.value}</span>
            <span>{result.hint}</span>
          </div>
        </div>
      );
    }

    // Default rendering for other attributes
    return (
      <div className={getCardClassName(result)}>
        <span>{result.value}</span>
        {result.hint && (
          <span className="hint">
            {result.hint}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="grid-container">
      <div className="pokemon-sprite">
        {guessNumber !== undefined && (
          <span className="guess-number">{guessNumber}</span>
        )}
        <img 
          src={pokemon.sprite_default} 
          alt={pokemon.name}
          loading="lazy"
        />
      </div>
      {results.map((result, index) => (
        <React.Fragment key={`${pokemon.name}-${index}`}>
          {renderResultCell(result, index)}
        </React.Fragment>
      ))}
    </div>
  );
}

export default GuessRow;