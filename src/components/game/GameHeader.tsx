'use client';

import React, { useEffect, useState } from 'react';
import { PokemonSearch } from './PokemonSearch';
import { Pokemon } from '@/types/pokemon';
import './GameHeader.css';

interface GameHeaderProps {
  onPokemonSelect: (pokemon: Pokemon) => void;
  onRandomGuess: () => void;
  streak: number;
  guessedPokemon: Pokemon[];
  disabled?: boolean;
}

const GameHeader: React.FC<GameHeaderProps> = ({
  onPokemonSelect,
  onRandomGuess,
  streak,
  guessedPokemon,
  disabled = false
}) => {
  const [randomGuessesRemaining, setRandomGuessesRemaining] = useState(5);
  
  // Load and track random guesses remaining
  useEffect(() => {
    const today = new Date().toDateString();
    const lastRandomDate = localStorage.getItem('pokedle-last-random-date');
    let guessesUsed = 0;
    
    // Reset counter for a new day
    if (lastRandomDate !== today) {
      localStorage.setItem('pokedle-random-guesses-used', '0');
      localStorage.setItem('pokedle-last-random-date', today);
    } else {
      guessesUsed = parseInt(localStorage.getItem('pokedle-random-guesses-used') || '0', 10);
    }
    
    setRandomGuessesRemaining(5 - guessesUsed);
  }, []);
  
  const handleRandomGuess = () => {
    if (randomGuessesRemaining > 0) {
      // Update local storage
      const guessesUsed = parseInt(localStorage.getItem('pokedle-random-guesses-used') || '0', 10) + 1;
      localStorage.setItem('pokedle-random-guesses-used', guessesUsed.toString());
      localStorage.setItem('pokedle-last-random-date', new Date().toDateString());
      
      // Update state
      setRandomGuessesRemaining(prev => prev - 1);
      
      // Call the original handler
      onRandomGuess();
    }
  };
  
  // Button is disabled if game is disabled or no random guesses remain
  const isRandomDisabled = disabled || randomGuessesRemaining <= 0;
  const buttonTitle = randomGuessesRemaining <= 0 
    ? "You've used all 5 random guesses for today" 
    : `Random guess (${randomGuessesRemaining} left today)`;
  
  return (
    <div className="game-header">
      <div className="streak-container">
        <div className="streak-counter">
          <span className="streak-label">STREAK</span>
          <span className="streak-value">{streak}</span>
        </div>
      </div>
      
      <div className="search-section">
        <div className="search-controls">
          <PokemonSearch 
            onSelect={onPokemonSelect} 
            guessedPokemon={guessedPokemon}
            disabled={disabled}
          />
        </div>
        
        <button 
          className="random-guess-btn"
          onClick={handleRandomGuess}
          disabled={isRandomDisabled}
          title={buttonTitle}
        >
          {/* Dice icon for random guess */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect>
            <circle cx="8" cy="8" r="1.5"></circle>
            <circle cx="16" cy="8" r="1.5"></circle>
            <circle cx="8" cy="16" r="1.5"></circle>
            <circle cx="16" cy="16" r="1.5"></circle>
            <circle cx="12" cy="12" r="1.5"></circle>
          </svg>
          {randomGuessesRemaining > 0 && (
            <span className="guess-counter">{randomGuessesRemaining}</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default GameHeader;