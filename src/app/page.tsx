'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import GameHeader from '@/components/game/GameHeader';
import GuessGrid from '@/components/game/GuessGrid';
import { Pokemon } from '@/types/pokemon';

export default function Home() {
  const [guesses, setGuesses] = useState<Pokemon[]>([]);
  const [targetPokemon, setTargetPokemon] = useState<Pokemon | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [isLoading, setIsLoading] = useState(false);
  
  // Use a ref to track if streak has been updated for the current game
  const streakUpdatedRef = useRef(false);
  const gameCompletedRef = useRef(false);

  // Load the daily Pokémon and streak from localStorage
  useEffect(() => {
    const fetchTargetPokemon = async () => {
      try {
        // Get current hour to help determine which daily Pokémon to show
        const now = new Date();
        const hour = now.getHours();
        
        const response = await fetch(`/api/daily?hour=${hour}`);
        if (!response.ok) {
          throw new Error('Failed to fetch daily pokemon');
        }
        const data = await response.json();
        if (!data.pokemon) {
          throw new Error('No pokemon data received');
        }
        setTargetPokemon(data.pokemon);

        // Load streak from localStorage
        const savedStreak = localStorage.getItem('pokedle-streak') || '0';
        const lastPlayedDate = localStorage.getItem('pokedle-last-played');
        const today = new Date().toDateString();
        
        if (lastPlayedDate !== today) {
          setStreak(parseInt(savedStreak));
          // Reset the streak updated flag for a new day
          streakUpdatedRef.current = false;
          gameCompletedRef.current = false;
        } else {
          // If already played today, load previous state
          setStreak(parseInt(savedStreak));
          streakUpdatedRef.current = data.isCompleted || false;
          gameCompletedRef.current = data.isCompleted || false;
          
          if (data.isCompleted) {
            if (data.won) {
              setGameState('won');
            } else {
              setGameState('lost');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching target pokemon:', error);
        setError('Failed to load the daily Pokemon. Please try refreshing.');
      }
    };

    fetchTargetPokemon();
  }, []);

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
    
    // Optional: Set a max number of guesses (uncomment if needed)
    // if (guesses.length >= MAX_GUESSES - 1) {
    //   setGameState('lost');
    // }
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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white bg-black">
        <div className="text-center">
          <p className="mb-4 text-red-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="header">
        <h1 className="title">Pokédle</h1>
      </header>

      <main className="main-container">
        <GameHeader
          onPokemonSelect={handleGuess}
          onRandomGuess={handleRandomGuess}
          streak={streak}
          guessedPokemon={guesses}
          disabled={!targetPokemon || gameState !== 'playing' || isLoading}
        />
        
        {targetPokemon ? (
          <GuessGrid guesses={guesses} target={targetPokemon} />
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-b-2 border-white rounded-full animate-spin"></div>
          </div>
        )}
        
        {gameState !== 'playing' && (
          <div className="p-4 mt-6 text-center bg-black rounded-lg game-result bg-opacity-70 backdrop-filter backdrop-blur-sm">
            {gameState === 'won' && (
              <h2 className="text-xl text-green-400">You won! The Pokémon was {targetPokemon?.name}!</h2>
            )}
            {gameState === 'lost' && (
              <h2 className="text-xl text-red-400">You lost! The Pokémon was {targetPokemon?.name}.</h2>
            )}
          </div>
        )}
      </main>
    </div>
  );
}