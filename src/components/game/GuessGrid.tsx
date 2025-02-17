// src/components/game/GuessGrid.tsx
'use client';

import { Pokemon } from '@/types/pokemon';
import { compareGuess } from '@/lib/game/compareGuess';

interface GuessGridProps {
  guesses: Pokemon[];
  target: Pokemon;  // Added target prop
}

export function GuessGrid({ guesses, target }: GuessGridProps) {
  const getResultClass = (isCorrect: boolean, isPartial?: boolean) => {
    if (isCorrect) return 'result-correct';
    if (isPartial) return 'result-partial';
    return 'result-incorrect';
  };

  return (
    <div className="space-y-2">
      {guesses.map((guess, index) => {
        const results = compareGuess(guess, target);
        
        return (
          <div key={index} className="grid-container">
            <div className="pokemon-sprite">
              <img src={guess.sprite_default} alt={guess.name} />
            </div>
            
            {Object.entries(results).map(([key, result]) => (
              <div key={key} className="stat-column">
                <div className="stat-label">{result.category}</div>
                <div className={`stat-value ${getResultClass(result.isCorrect, result.isPartiallyCorrect)}`}>
                  {result.value}
                  {result.hint && <span className="hint">{result.hint}</span>}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}