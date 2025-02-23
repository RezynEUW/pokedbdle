'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { PokemonSearch } from './PokemonSearch';
import { Pokemon } from '@/types/pokemon';
import HelpModal from './HelpModal';
import SettingsModal from './SettingsModal';
import './GameHeader.css';
import GenSelect from './GenSelect';

interface GameHeaderProps {
  onPokemonSelect: (pokemon: Pokemon) => void;
  onRandomGuess: () => void;
  onResetGame: () => void;
  streak: number;
  guessedPokemon: Pokemon[];
  gameState: 'playing' | 'won' | 'lost';
  yesterdaysPokemon?: Pokemon;
  targetPokemon: Pokemon | null;
  guessCount: number;
  disabled?: boolean;
  onGenerationsChange: (gens: number[]) => void;
}

const GameHeader: React.FC<GameHeaderProps> = ({
  onPokemonSelect,
  onRandomGuess,
  onResetGame,
  streak,
  guessedPokemon,
  gameState,
  yesterdaysPokemon,
  targetPokemon,
  guessCount,
  disabled = false,
}) => {
  const [randomGuessesRemaining, setRandomGuessesRemaining] = useState(5);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isWinMessageOpen, setIsWinMessageOpen] = useState(true);
  
  useEffect(() => {
    if (gameState === 'won') {
      setIsWinMessageOpen(true);
    } else {
      setIsWinMessageOpen(false);
    }
  }, [gameState]);
  
  useEffect(() => {
    const today = new Date().toDateString();
    const lastRandomDate = localStorage.getItem('pokedle-last-random-date');
    let guessesUsed = 0;
    
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
      const guessesUsed = parseInt(localStorage.getItem('pokedle-random-guesses-used') || '0', 10) + 1;
      localStorage.setItem('pokedle-random-guesses-used', guessesUsed.toString());
      localStorage.setItem('pokedle-last-random-date', new Date().toDateString());
      setRandomGuessesRemaining(prev => prev - 1);
      onRandomGuess();
    }
  };

  const handleCloseWinMessage = () => {
    setIsWinMessageOpen(false);
  };
  
  const isRandomDisabled = disabled || randomGuessesRemaining <= 0 || gameState !== 'playing';
  const buttonTitle = gameState !== 'playing'
    ? "Game completed" 
    : randomGuessesRemaining <= 0 
    ? "You've used all 5 random guesses for today" 
    : `Random guess (${randomGuessesRemaining} left today)`;
  
  return (
    <div className="game-header">
      <div className="header-top-row">
        <div className="left-controls">
          <div className="streak-container">
            <div className="streak-counter">
              <span className="streak-label">STREAK</span>
              <span className="streak-value">{streak}</span>
            </div>
            
            {yesterdaysPokemon && (
              <div className="yesterday-pokemon">
                <Image
                  src={yesterdaysPokemon.sprite_official} 
                  alt={yesterdaysPokemon.name} 
                  className="yesterday-pokemon-image"
                  width={80}
                  height={80}
                  priority
                />
                <div className="yesterday-pokemon-text">
                  <span className="yesterday-pokemon-label">
                    Yesterday was
                  </span>
                  <span className="yesterday-pokemon-label">
                    {yesterdaysPokemon.name}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="center-column">
          <div className="button-group">
            <button 
              className="random-guess-btn"
              onClick={handleRandomGuess}
              disabled={isRandomDisabled}
              title={buttonTitle}
            >
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
            
            <button 
              className="icon-btn help-btn" 
              onClick={() => setIsHelpModalOpen(true)}
              title="Help"
            >
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
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </button>
            
            <button 
              className="icon-btn settings-btn" 
              onClick={() => setIsSettingsModalOpen(true)}
              title="Settings"
            >
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
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>
            
            <button 
              className="icon-btn reset-btn" 
              onClick={onResetGame}
              title="Reset Game"
              disabled={gameState === 'playing'}
            >
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
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <path d="M3 3v5h5"></path>
              </svg>
            </button>
          </div>

          <div className="search-wrapper">
            <PokemonSearch 
              onSelect={onPokemonSelect} 
              guessedPokemon={guessedPokemon}
              disabled={disabled || gameState !== 'playing'}
            />
          </div>
        </div>
      </div>

      {targetPokemon && gameState === 'won' && isWinMessageOpen && (
        <div className="win-message-container">
          <div className="win-message">
            <button 
              className="win-message-close-btn" 
              onClick={handleCloseWinMessage}
              title="Close"
            >
              x
            </button>
            <div className="win-message-pokemon-sprites">
              <Image
                src={targetPokemon.sprite_default} 
                alt={`${targetPokemon.name} default sprite`} 
                width={90}
                height={90}
                priority
              />
            </div>
            <div className="win-message-text">
              <div className="win-message-title">
                Congratulations!
              </div>
              <div className="win-message-pokemon-name">
                {targetPokemon.name}
              </div>
              <div className="win-message-guesses">
                Guessed in {guessCount} {guessCount === 1 ? 'try' : 'tries'}
              </div>
            </div>
            <div className="win-message-pokemon-sprites-shiny">
            <Image
              src={targetPokemon.sprite_shiny} 
              alt={`${targetPokemon.name} shiny sprite`} 
              width={90}
              height={90}
              priority
            />
            
            </div>
          </div>
        </div>
      )}

      <HelpModal 
        isOpen={isHelpModalOpen} 
        onClose={() => setIsHelpModalOpen(false)} 
      />
      
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
      />

      
    </div>
  );
};

export default GameHeader;