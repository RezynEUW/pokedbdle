// src/components/game/GuessGrid.tsx
'use client';

import React from 'react';
import { Pokemon } from '@/types/pokemon';
import { compareGuess } from '@/lib/game/compareGuess';
import './GuessGrid.css';

function formatGeneration(gen: string): string {
  const generationMap: {[key: string]: string} = {
    'generation-i': 'Gen 1',
    'generation-ii': 'Gen 2',
    'generation-iii': 'Gen 3',
    'generation-iv': 'Gen 4',
    'generation-v': 'Gen 5',
    'generation-vi': 'Gen 6',
    'generation-vii': 'Gen 7',
    'generation-viii': 'Gen 8',
    'generation-ix': 'Gen 9'
  };
  return generationMap[gen] || gen;
}

function formatColor(color: string): string {
  return color.charAt(0).toUpperCase() + color.slice(1);
}

function formatEggGroup(group: string): string {
  return group.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

interface GuessGridProps {
  guesses: Pokemon[];
  target: Pokemon;
}

const GuessGrid: React.FC<GuessGridProps> = ({ guesses, target }) => {
  const displayGuesses = [...guesses].reverse();

  return (
    <div className="guesses-container">
      <div className="column-headers">
        <div className="header-cell">Pokemon</div>
        <div className="header-cell">Type</div>
        <div className="header-cell">Generation</div>
        <div className="header-cell">Color</div>
        <div className="header-cell">Evolution</div>
        <div className="header-cell">Height</div>
        <div className="header-cell">Weight</div>
        <div className="header-cell">BST</div>
        <div className="header-cell">Egg Groups</div>
        <div className="header-cell">Ability</div>
      </div>

      {displayGuesses.map((guess, index) => {
        const comparisonResults = compareGuess(guess, target);
        
        return (
          <div key={`guess-${displayGuesses.length - index}`} className="grid-container">
            <div className="pokemon-sprite">
              <img 
                src={guess?.sprite_default || ''} 
                alt={guess?.name || 'Unknown Pokemon'}
              />
            </div>

            <div className={`stat-card ${
              comparisonResults.types.isCorrect ? 'correct' : 
              comparisonResults.types.isPartiallyCorrect ? 'partial' : 'incorrect'
            }`}>
              <div className="type-icons">
                {(guess?.types || []).map((type: string) => (
                  <img 
                    key={type} 
                    src={`/icons/${type.charAt(0).toUpperCase() + type.slice(1)}.png`} 
                    alt={type} 
                    className="type-icon"
                    width="70"
                    height="17"
                  />
                ))}
              </div>
            </div>

            <div className={`stat-card ${comparisonResults.generation.isCorrect ? 'correct' : 'incorrect'}`}>
              {formatGeneration(guess?.generation || '-')}
            </div>

            <div className={`stat-card ${comparisonResults.color.isCorrect ? 'correct' : 'incorrect'}`}>
              {formatColor(guess?.color || '-')}
            </div>

            <div className={`stat-card ${comparisonResults.evolution.isCorrect ? 'correct' : 'incorrect'}`}>
              {guess?.evolution_stage ? guess.evolution_stage.replace('stage', 'Stage ') : '-'}
            </div>

            <div className={`stat-card ${comparisonResults.height.isCorrect ? 'correct' : 'incorrect'}`}>
              {guess?.height ? `${(guess.height / 10).toFixed(1)}m` : '-'}
              {comparisonResults.height.hint && <span className="hint">{comparisonResults.height.hint}</span>}
            </div>

            <div className={`stat-card ${comparisonResults.weight.isCorrect ? 'correct' : 'incorrect'}`}>
              {guess?.weight ? `${(guess.weight / 10).toFixed(1)}kg` : '-'}
              {comparisonResults.weight.hint && <span className="hint">{comparisonResults.weight.hint}</span>}
            </div>

            <div className={`stat-card ${comparisonResults.bst.isCorrect ? 'correct' : 'incorrect'}`}>
              {guess?.base_stat_total || '-'}
              {comparisonResults.bst.hint && <span className="hint">{comparisonResults.bst.hint}</span>}
            </div>

            <div className={`stat-card ${
              comparisonResults.eggGroups.isCorrect ? 'correct' : 
              comparisonResults.eggGroups.isPartiallyCorrect ? 'partial' : 'incorrect'
            }`}>
              {(guess?.egg_groups || []).map(formatEggGroup).join(', ') || '-'}
            </div>

            <div className={`stat-card ${
              comparisonResults.abilities.isCorrect ? 'correct' : 
              comparisonResults.abilities.isPartiallyCorrect ? 'partial' : 'incorrect'
            }`}>
              {(guess?.abilities || [])
                .map((ability: string) => 
                  ability.split('-')
                    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')
                )
                .join(', ') || '-'}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GuessGrid;