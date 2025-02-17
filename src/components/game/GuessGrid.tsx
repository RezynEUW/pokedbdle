// src/components/game/GuessGrid.tsx
'use client';

import React from 'react';
import { Pokemon } from '@/types/pokemon';

interface GuessGridProps {
  guesses: Pokemon[];
  target: Pokemon;
}

const GuessGrid: React.FC<GuessGridProps> = ({ guesses, target }) => {
  const compareTypes = (guessTypes: string[] = [], targetTypes: string[] = []) => {
    if (!guessTypes || !targetTypes) return { isCorrect: false, isPartial: false };
    const hasExactMatch = guessTypes.length === targetTypes.length && 
      guessTypes.every(type => targetTypes.includes(type));
    const hasPartialMatch = guessTypes.some(type => targetTypes.includes(type));
    return { isCorrect: hasExactMatch, isPartial: hasPartialMatch };
  };

  const formatStatName = (stat: string) => {
    if (!stat) return '';
    // Convert "special-attack" to "Special Attack", etc.
    return stat.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const compareStats = (guessStats: string[] = [], targetStats: string[] = []) => {
    const normalizedGuess = (guessStats || []).map(s => s?.toLowerCase()).filter(Boolean);
    const normalizedTarget = (targetStats || []).map(s => s?.toLowerCase()).filter(Boolean);

    const hasExactMatch = normalizedGuess.length === normalizedTarget.length &&
      normalizedGuess.every(stat => normalizedTarget.includes(stat));
    const hasPartialMatch = normalizedGuess.some(stat => normalizedTarget.includes(stat));

    return { 
      isCorrect: hasExactMatch,
      isPartial: !hasExactMatch && hasPartialMatch
    };
  };

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
        <div className="header-cell">Highest Stat</div>
        <div className="header-cell">Ability</div>
      </div>

      {displayGuesses.map((guess, index) => {
        const typeComparison = compareTypes(guess?.types || [], target?.types || []);
        const statComparison = compareStats(guess?.highest_stats || [], target?.highest_stats || []);
        const abilityComparison = compareStats(guess?.abilities || [], target?.abilities || []);
        
        return (
          <div key={`guess-${displayGuesses.length - index}`} className="grid-container">
            <div className="pokemon-sprite">
              <img 
                src={guess?.sprite_default || ''} 
                alt={guess?.name || 'Unknown Pokemon'}
              />
            </div>

            <div className={`stat-card ${typeComparison.isCorrect ? 'correct' : 
              typeComparison.isPartial ? 'partial' : 'incorrect'}`}>
              {(guess?.types || []).join('/')}
            </div>

            <div className={`stat-card ${guess?.generation === target?.generation ? 'correct' : 'incorrect'}`}>
              {guess?.generation || '-'}
            </div>

            <div className={`stat-card ${guess?.color === target?.color ? 'correct' : 'incorrect'}`}>
              {guess?.color || '-'}
            </div>

            <div className={`stat-card ${guess?.evolution_stage === target?.evolution_stage ? 'correct' : 'incorrect'}`}>
              {guess?.evolution_stage ? guess.evolution_stage.replace('stage', 'Stage ') : '-'}
            </div>

            <div className={`stat-card ${guess?.height === target?.height ? 'correct' : 'incorrect'}`}>
              {guess?.height ? `${(guess.height / 10).toFixed(1)}m` : '-'}
              {guess?.height !== target?.height && guess?.height && target?.height && (
                <span className="ml-1">{guess.height > target.height ? '↓' : '↑'}</span>
              )}
            </div>

            <div className={`stat-card ${guess?.weight === target?.weight ? 'correct' : 'incorrect'}`}>
              {guess?.weight ? `${(guess.weight / 10).toFixed(1)}kg` : '-'}
              {guess?.weight !== target?.weight && guess?.weight && target?.weight && (
                <span className="ml-1">{guess.weight > target.weight ? '↓' : '↑'}</span>
              )}
            </div>

            <div className={`stat-card ${guess?.base_stat_total === target?.base_stat_total ? 'correct' : 'incorrect'}`}>
              {guess?.base_stat_total || '-'}
              {guess?.base_stat_total !== target?.base_stat_total && guess?.base_stat_total && target?.base_stat_total && (
                <span className="ml-1">
                  {guess.base_stat_total > target.base_stat_total ? '↓' : '↑'}
                </span>
              )}
            </div>

            <div className={`stat-card ${
              statComparison.isCorrect ? 'correct' : 
              statComparison.isPartial ? 'partial' : 'incorrect'
            }`}>
              {(guess?.highest_stats || []).map(formatStatName).filter(Boolean).join(', ') || '-'}
            </div>

            <div className={`stat-card ${
              abilityComparison.isCorrect ? 'correct' : 
              abilityComparison.isPartial ? 'partial' : 'incorrect'
            }`}>
              {(guess?.abilities || []).join(', ') || '-'}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default GuessGrid;