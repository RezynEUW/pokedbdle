'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import GameHeader from '@/components/game/GameHeader';
import GuessGrid from '@/components/game/GuessGrid';
import { Pokemon } from '@/types/pokemon';
import { getSelectedGenerations, saveSelectedGenerations, saveGameGenerations } from '@/lib/game/storage';
import Footer from '@/components/ui/Footer';

export default function Home() {
  const [guesses, setGuesses] = useState<Pokemon[]>([]);
  const [targetPokemon, setTargetPokemon] = useState<Pokemon | null>(null);
  const [yesterdaysPokemon, setYesterdaysPokemon] = useState<Pokemon | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [isLoading, setIsLoading] = useState(false);
  const [isGlobalDaily, setIsGlobalDaily] = useState(true);
  const [selectedGenerations, setSelectedGenerations] = useState<number[]>([]);

  // Use refs to track game state persistence
  const streakUpdatedRef = useRef(false);
  const gameCompletedRef = useRef(false);

  // Initialize selected generations on mount
  useEffect(() => {
    const generations = getSelectedGenerations();
    setSelectedGenerations(generations);
  }, []);

  // Load the daily Pokémon and game state from localStorage
  const fetchDailyPokemon = useCallback(async (generations?: number[]) => {
    try {
      setIsLoading(true);
      // Get current hour to help determine which daily Pokémon to show
      const now = new Date();
      const hour = now.getHours();
      const gens = generations || selectedGenerations;

      // Retrieve saved game state
      const savedGameState = localStorage.getItem('pokedle-game-state');
      const today = now.toDateString();

      // Fetch daily Pokemon with selected generations
      const params = new URLSearchParams({
        hour: hour.toString(),
        generations: gens.join(',')
      });
      
      const response = await fetch(`/api/daily?${params}`);
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

      // Store whether this is the global daily or a generation-specific one
      setIsGlobalDaily(data.isGlobalDaily || false);

      // Save the generations used for this game
      saveGameGenerations(gens);

      // If we're loading with new generations, don't use saved state
      if (generations) {
        // Reset the game state and guesses
        setTargetPokemon(data.pokemon);
        setGuesses([]);
        setGameState('playing');
        
        // Reset the streak updated ref for the new game
        streakUpdatedRef.current = false;
        gameCompletedRef.current = false;
        return;
      }

      // Only use saved state if not changing generations
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
    } finally {
      setIsLoading(false);
    }
  }, [selectedGenerations]);

  // Initial fetch
  useEffect(() => {
    if (selectedGenerations.length > 0) {
      fetchDailyPokemon();
    }
  }, [fetchDailyPokemon, selectedGenerations]);

  // Save game state to localStorage
  useEffect(() => {
    if (!targetPokemon) return;

    // Only save state when game state changes or guesses are made
    const gameStateToSave = {
      date: new Date().toDateString(),
      guesses,
      streak,
      gameState,
      targetPokemonId: targetPokemon.id,
      generations: selectedGenerations // Save the current generations
    };

    localStorage.setItem('pokedle-game-state', JSON.stringify(gameStateToSave));
  }, [guesses, gameState, streak, targetPokemon, selectedGenerations]);

  // Save streak and game state to localStorage - only once per game
  useEffect(() => {
    // Only update if the game state changed from playing to won/lost
    if ((gameState === 'won' || gameState === 'lost') && !streakUpdatedRef.current) {
      // Store the game completion status
      gameCompletedRef.current = true;

      // Get current hour for API consistency
      const hour = new Date().getHours();

      // Check if streak was already updated today
      const today = new Date().toDateString();
      const lastStreakDate = localStorage.getItem('pokedle-last-streak-date');
      
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

      // Only update streak if it hasn't been updated today
      if (lastStreakDate !== today) {
        if (gameState === 'won') {
          // Calculate new streak before saving
          const newStreak = streak + 1;
          setStreak(newStreak);
          localStorage.setItem('pokedle-streak', newStreak.toString());
          // Record today's date for streak update
          localStorage.setItem('pokedle-last-streak-date', today);
        } else {
          // Reset streak on loss
          setStreak(0);
          localStorage.setItem('pokedle-streak', '0');
          // Record today's date for streak update
          localStorage.setItem('pokedle-last-streak-date', today);
        }
      }

      // Record today's date regardless of win/loss
      localStorage.setItem('pokedle-last-played', today);
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

      // Build the URL with excluded IDs and selected generations
      const params = new URLSearchParams();
      if (guessedIds.length > 0) {
        params.set('exclude', guessedIds.join(','));
      }
      params.set('generations', selectedGenerations.join(','));
      
      const response = await fetch(`/api/random?${params}`);

      if (!response.ok) throw new Error('Failed to fetch random pokemon');

      const randomPokemon = await response.json();
      handleGuess(randomPokemon);

    } catch (error) {
      console.error('Error making random guess:', error);
    } finally {
      setIsLoading(false);
    }
  }, [targetPokemon, guesses, gameState, handleGuess, isLoading, selectedGenerations]);

  // Reset game function for when game is completed
  const handleResetGame = useCallback(() => {
    // Clear saved game state
    localStorage.removeItem('pokedle-game-state');

    // Reset local state
    setGuesses([]);
    setGameState('playing');
    streakUpdatedRef.current = false;
    gameCompletedRef.current = false;

    // Fetch new Pokémon with current generations
    fetchDailyPokemon();
  }, [fetchDailyPokemon]);

  const handleGenerationsChange = useCallback((generations: number[]) => {
    // Only allow generation changes if the game is not complete
    if (gameState !== 'playing') return;
    
    // Save the selected generations
    saveSelectedGenerations(generations);
    setSelectedGenerations(generations);
    
    // Completely reset the game state, including localStorage
    localStorage.removeItem('pokedle-game-state');
    setGuesses([]);
    setGameState('playing');
    streakUpdatedRef.current = false;
    gameCompletedRef.current = false;
    
    // Fetch new Pokémon with the selected generations 
    // Pass the generations to ensure we don't use saved state
    fetchDailyPokemon(generations);
  }, [fetchDailyPokemon, gameState]);

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
          targetPokemon={targetPokemon}
          guessCount={guesses.length}
          disabled={!targetPokemon || gameState !== 'playing' || isLoading}
          onGenerationsChange={handleGenerationsChange}
          selectedGenerations={selectedGenerations}
        />

        {targetPokemon ? (
          <div className="game-result-container">
            {!isGlobalDaily && (
              <div className="custom-daily-notice">
                You&apos;re playing with a Pokémon from your selected generations (Gen {selectedGenerations.join(', ')}).
              </div>
            )}
            <GuessGrid guesses={guesses} target={targetPokemon} />
          </div>
        ) : (
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}