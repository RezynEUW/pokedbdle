'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Pokemon } from '@/types/pokemon';
import { compareGuess } from '@/lib/game/compareGuess';
import './GuessGrid.css';

function formatGeneration(gen: string): string {
  const generationMap: { [key: string]: string } = {
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
  return group
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

interface GuessGridProps {
  guesses: Pokemon[];
  target: Pokemon;
}

const GuessGrid: React.FC<GuessGridProps> = ({ guesses, target }) => {
  const [displayGuesses, setDisplayGuesses] = useState<Pokemon[]>([]);
  const reversedGuesses = [...guesses].reverse();
  const correctSound = useRef<HTMLAudioElement | null>(null);
  const wrongSound = useRef<HTMLAudioElement | null>(null);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const dailyShinyId = useMemo(() => {
    const date = new Date();
    const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
    
    // Use the seed to generate a number between 1 and 1025
    const baseNumber = ((seed * 9301 + 49297) % 233280) % 1025 + 1;
    
    // If it happens to be the same as target.id, add 1 (or wrap back to 1)
    if (baseNumber === target.id) {
      return baseNumber === 1025 ? 1 : baseNumber + 1;
    }
    
    return baseNumber;
  }, [target.id]);

  useEffect(() => {
    // Initialize audio elements
    correctSound.current = new Audio('/sfx/ding.mp3');
    wrongSound.current = new Audio('/sfx/ding.mp3');
    
    if (correctSound.current) {
      correctSound.current.volume = 0.3;
      correctSound.current.preload = 'auto';
    }
    if (wrongSound.current) {
      wrongSound.current.volume = 0;
      wrongSound.current.preload = 'auto';
    }

    // Load sounds
    const loadSounds = async () => {
      try {
        if (correctSound.current) {
          await correctSound.current.load();
          console.log('Correct sound loaded');
        }
        if (wrongSound.current) {
          await wrongSound.current.load();
          console.log('Wrong sound loaded');
        }
      } catch (error) {
        console.error('Error loading sounds:', error);
      }
    };

    loadSounds();

    // Cleanup function
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  // Function to play sound based on card state
  const playSound = (isCorrect: boolean) => {
    console.log('Attempting to play sound:', isCorrect ? 'correct' : 'incorrect');
    try {
      if (isCorrect && correctSound.current) {
        console.log('Playing correct sound');
        correctSound.current.currentTime = 0;
        const playPromise = correctSound.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log('Error playing correct sound:', error);
          });
        }
      } else if (!isCorrect && wrongSound.current) {
        console.log('Playing incorrect sound');
        wrongSound.current.currentTime = 0;
        const playPromise = wrongSound.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log('Error playing incorrect sound:', error);
          });
        }
      }
    } catch (error) {
      console.error('Error in playSound:', error);
    }
  };

  useEffect(() => {
    // Clear any existing timeouts
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current = [];

    // If this is the first load
    if (displayGuesses.length === 0 && guesses.length > 0) {
      setDisplayGuesses(reversedGuesses);
      return;
    }

    // If a new guess was added
    if (guesses.length > displayGuesses.length) {
      console.log('New guess detected');
      setDisplayGuesses(reversedGuesses);
      
      // Get the latest guess and its comparison results
      const latestGuess = reversedGuesses[0];
      const results = compareGuess(latestGuess, target);

      // Schedule sounds for each card reveal
      const resultArray = [
        { isCorrect: Boolean(results.types.isCorrect || results.types.isPartiallyCorrect) },
        { isCorrect: Boolean(results.generation.isCorrect) },
        { isCorrect: Boolean(results.color.isCorrect) },
        { isCorrect: Boolean(results.evolution.isCorrect) },
        { isCorrect: Boolean(results.height.isCorrect) },
        { isCorrect: Boolean(results.weight.isCorrect) },
        { isCorrect: Boolean(results.bst.isCorrect) },
        { isCorrect: Boolean(results.eggGroups?.isCorrect || results.eggGroups?.isPartiallyCorrect) },
        { isCorrect: Boolean(results.abilities?.isCorrect || results.abilities?.isPartiallyCorrect) }
      ];

      console.log('Scheduling sounds for results:', resultArray);

      resultArray.forEach((result, index) => {
        const timeout = setTimeout(() => {
          console.log(`Playing sound for card ${index + 1}:`, result.isCorrect ? 'correct' : 'incorrect');
          playSound(result.isCorrect);
        }, 200 * (index + 1));
        timeoutsRef.current.push(timeout);
      });
    }
  }, [guesses.length]);

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
                    src={guess?.id === dailyShinyId ? (guess?.sprite_shiny || guess?.sprite_default) : guess?.sprite_default} 
                    alt={guess?.name || 'Unknown Pokemon'}
                    />
                </div>

            <div className={`stat-card type-card ${
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
              comparisonResults.eggGroups?.isCorrect ? 'correct' : 
              comparisonResults.eggGroups?.isPartiallyCorrect ? 'partial' : 'incorrect'
            }`}>
              {(guess?.egg_groups || []).map(formatEggGroup).join(', ') || '-'}
            </div>

            <div className={`stat-card ${
              comparisonResults.abilities?.isCorrect ? 'correct' : 
              comparisonResults.abilities?.isPartiallyCorrect ? 'partial' : 'incorrect'
            }`}>
              {(guess?.abilities || [])
                .map((ability: string) => 
                  ability
                    .split('-')
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