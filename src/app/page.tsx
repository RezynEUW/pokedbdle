'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import GameHeader from '@/components/game/GameHeader';
import GuessGrid from '@/components/game/GuessGrid';
import { Pokemon } from '@/types/pokemon';

export default function Home() {
  const [guesses, setGuesses] = useState<Pokemon[]>([]);
  const [targetPokemon, setTargetPokemon] = useState<Pokemon | null>(null);
  const [yesterdaysPokemon, setYesterdaysPokemon] = useState<Pokemon | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [isLoading, setIsLoading] = useState(false);

  // Use refs to track game state persistence
  const streakUpdatedRef = useRef(false);
  const gameCompletedRef = useRef(false);

  // Load the daily Pokémon and game state from localStorage
  useEffect(() => {
    const fetchDailyPokemon = async () => {
      try {
        // Get current hour to help determine which daily Pokémon to show
        const now = new Date();
        const hour = now.getHours();

        // Retrieve saved game state
        const savedGameState = localStorage.getItem('pokedle-game-state');
        const today = now.toDateString();

        // Fetch daily Pokemon
        const response = await fetch(`/api/daily?hour=${hour}`);
        if (!response.ok) {
          throw new Error('Failed to fetch daily pokemon');
        }
        const data = await response.json();
        if (!data.pokemon) {
          throw new Error('No pokemon data received');
        }

        // Set yesterday's Pokemon
        if (data.yesterdayPokemon) {
          setYesterdaysPokemon(data.yesterdayPokemon);
        }

        // Determine how to load the game state
        if (savedGameState) {
          const parsedState = JSON.parse(savedGameState);

          // Check if saved state is from today
          if (parsedState.date === today) {
            // Restore game state
            setTargetPokemon(data.pokemon);
            setGuesses(parsedState.guesses || []);
            setStreak(parsedState.streak);

            // Restore game completion status
            if (parsedState.gameState !== 'playing') {
              setGameState(parsedState.gameState);
              streakUpdatedRef.current = true;
              gameCompletedRef.current = true;
            }
            return;
          }
        }

        // First-time play or new day
        setTargetPokemon(data.pokemon);

        // Load streak from localStorage
        const savedStreak = localStorage.getItem('pokedle-streak') || '0';
        setStreak(parseInt(savedStreak));

        // Reset game state references
        streakUpdatedRef.current = false;
        gameCompletedRef.current = false;

      } catch (error) {
        console.error('Error fetching target pokemon:', error);
        setError('Failed to load the daily Pokemon. Please try refreshing.');
      }
    };

    fetchDailyPokemon();
  }, []);

  // Save game state to localStorage
  useEffect(() => {
    if (!targetPokemon) return;

    // Only save state when game state changes or guesses are made
    const gameStateToSave = {
      date: new Date().toDateString(),
      guesses,
      streak,
      gameState,
      targetPokemonId: targetPokemon.id
    };

    localStorage.setItem('pokedle-game-state', JSON.stringify(gameStateToSave));
  }, [guesses, gameState, streak, targetPokemon]);

  // Save streak and game state to localStorage - only once per game
  useEffect(() => {
    // Only update if the game state changed from playing to won/lost
    if ((gameState === 'won' || gameState === 'lost') && !streakUpdatedRef.current) {
      // Store the game completion status
      gameCompletedRef.current = true;

      // Get current hour for API consistency
      const hour = new Date().getHours();

      // Update API that game is completed
      fetch(`/api/daily/complete?hour=${hour}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: true,
          won: gameState === 'won'
        }),
      }).catch(err => console.error('Failed to update completion status:', err));

      if (gameState === 'won') {
        // Calculate new streak before saving
        const newStreak = streak + 1;
        setStreak(newStreak);
        localStorage.setItem('pokedle-streak', newStreak.toString());
      } else {
        // Reset streak on loss
        setStreak(0);
        localStorage.setItem('pokedle-streak', '0');
      }

      // Record today's date regardless of win/loss
      localStorage.setItem('pokedle-last-played', new Date().toDateString());
      // Mark streak as updated to prevent multiple updates
      streakUpdatedRef.current = true;
    }
  }, [gameState, streak]);

  const handleGuess = useCallback((pokemon: Pokemon) => {
    if (!targetPokemon || gameState !== 'playing') return;

    // Prevent duplicate guesses
    if (guesses.some(g => g.id === pokemon.id)) {
      return;
    }

    // Add the new guess
    setGuesses(prev => [...prev, pokemon]);

    // Check if the guess is correct
    if (pokemon.id === targetPokemon.id) {
      setGameState('won');
    }
  }, [targetPokemon, guesses, gameState]);

  const handleRandomGuess = useCallback(async () => {
    if (!targetPokemon || gameState !== 'playing' || isLoading) return;

    try {
      setIsLoading(true);

      // Get the IDs of already guessed Pokémon
      const guessedIds = guesses.map(g => g.id);

      // Build the URL with excluded IDs
      const excludeParam = guessedIds.length > 0 ? `?exclude=${guessedIds.join(',')}` : '';
      const response = await fetch(`/api/random${excludeParam}`);

      if (!response.ok) throw new Error('Failed to fetch random pokemon');

      const randomPokemon = await response.json();
      handleGuess(randomPokemon);

    } catch (error) {
      console.error('Error making random guess:', error);
    } finally {
      setIsLoading(false);
    }
  }, [targetPokemon, guesses, gameState, handleGuess, isLoading]);

  // Reset game function for when game is completed
  const handleResetGame = useCallback(() => {
    // Clear saved game state
    localStorage.removeItem('pokedle-game-state');

    // Reset local state
    setGuesses([]);
    setGameState('playing');

    // Trigger a page reload to fetch a new daily Pokemon
    window.location.reload();
  }, []);

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <p className="error-message">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-screen">
      <header className="main-header">
        <h1 className="main-title">Pokédle</h1>
      </header>

      <main className="main-container">
        <GameHeader
          onPokemonSelect={handleGuess}
          onRandomGuess={handleRandomGuess}
          onResetGame={handleResetGame}
          streak={streak}
          guessedPokemon={guesses}
          gameState={gameState}
          yesterdaysPokemon={yesterdaysPokemon || undefined}
          disabled={!targetPokemon || gameState !== 'playing' || isLoading}
        />

        {targetPokemon ? (
          <div className="game-result-container">
            <GuessGrid guesses={guesses} target={targetPokemon} />
            
            {gameState === 'won' && (
              <div className="win-message-wrapper">
                <div className="win-message">
                  <div className="win-message-title">
                    Congratulations!
                  </div>
                  <div className="win-message-subtitle">
                    You guessed {targetPokemon.name}!
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        )}
      </main>
    </div>
  );
}