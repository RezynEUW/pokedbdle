'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import GameHeader from '@/components/game/GameHeader';
import GuessGrid from '@/components/game/GuessGrid';
import { Pokemon } from '@/types/pokemon';
import { getSelectedGenerations, saveSelectedGenerations, saveGameGenerations } from '@/lib/game/storage';
import Footer from '@/components/ui/Footer';

// Main component with all functionality
function HomePage() {
  // Initialize selectedGenerations with default value to avoid SSR issues
  const [guesses, setGuesses] = useState<Pokemon[]>([]);
  const [targetPokemon, setTargetPokemon] = useState<Pokemon | null>(null);
  const [yesterdaysPokemon, setYesterdaysPokemon] = useState<Pokemon | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [isLoading, setIsLoading] = useState(true);
  const [isGlobalDaily, setIsGlobalDaily] = useState(true);
  const [selectedGenerations, setSelectedGenerations] = useState<number[]>(
    // Default value for SSR
    Array.from({ length: 9 }, (_, i) => i + 1)
  );

  // Use refs to track game state persistence
  const streakUpdatedRef = useRef(false);
  const gameCompletedRef = useRef(false);
  
  // Ref to track generations change timer
  const generationsChangeTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Ref to track if a reset is in progress
  const resetInProgressRef = useRef(false);
  
  // Ref to track the active generations
  const activeGenerationsRef = useRef<number[]>([]);
  
  // Ref to track the last fetch time to prevent too frequent fetches
  const lastFetchTimeRef = useRef<number>(0);
  
  // Ref to track date check interval
  const dateCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize safeLocalStorage to maintain referential stability
  const safeLocalStorage = useMemo(() => ({
    getItem: (key: string) => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    },
    setItem: (key: string, value: string) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
      }
    },
    removeItem: (key: string) => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    }
  }), []); // Empty dependency array ensures it's only created once

  // Initialize selected generations on mount
  useEffect(() => {
    // Ensure this only runs on client-side
    if (typeof window !== 'undefined') {
      const generations = getSelectedGenerations();
      setSelectedGenerations(generations);
      // Also store in ref for consistent access
      activeGenerationsRef.current = generations;
      console.log('Initialized with generations:', generations);
    }
  }, []);
  
  // Date change detection
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const today = new Date().toDateString();
    // Save current date for future comparisons
    safeLocalStorage.setItem('pokedle-current-date', today);
    
    // Setup interval to check for date changes
    dateCheckIntervalRef.current = setInterval(() => {
      const currentDate = new Date().toDateString();
      const savedDate = safeLocalStorage.getItem('pokedle-current-date');
      
      // If date has changed since page load
      if (savedDate && currentDate !== savedDate) {
        console.log('Date changed from', savedDate, 'to', currentDate);
        safeLocalStorage.setItem('pokedle-current-date', currentDate);
        
        // Clear game state for the new day
        safeLocalStorage.removeItem('pokedle-game-state');
        
        // Reload the page to get the new daily Pokémon
        window.location.reload();
      }
    }, 60000); // Check every minute
    
    // Clean up interval on unmount
    return () => {
      if (dateCheckIntervalRef.current) {
        clearInterval(dateCheckIntervalRef.current);
        dateCheckIntervalRef.current = null;
      }
    };
  }, [safeLocalStorage]);

  // Load the daily Pokémon and game state from localStorage
  const fetchDailyPokemon = useCallback(async (generations?: number[], forceRefresh = false) => {
    try {
      // Prevent rapid re-fetches (e.g., due to multiple state updates)
      const now = Date.now();
      if (!forceRefresh && now - lastFetchTimeRef.current < 2000) {
        console.log('Skipping fetch - too soon since last fetch');
        return;
      }
      lastFetchTimeRef.current = now;
      
      setIsLoading(true);
      // Get the current date in YYYY-MM-DD format
      const currentDate = new Date();
      const localDate = currentDate.toISOString().split('T')[0];
      
      // Use provided generations, selected generations state, or active generations ref (in that order)
      const gens = generations || selectedGenerations || activeGenerationsRef.current;
      console.log('Fetching daily Pokémon with generations:', gens);
      
      // Update active generations ref for consistency
      activeGenerationsRef.current = gens;

      // Only check localStorage if not forcing a refresh
      if (!forceRefresh) {
        // Retrieve saved game state (safely)
        const savedGameState = safeLocalStorage.getItem('pokedle-game-state');
        const today = currentDate.toDateString();

        // Only use saved state if not changing generations or forcing refresh
        if (savedGameState && !generations && !forceRefresh) {
          try {
            const parsedState = JSON.parse(savedGameState);

            // Check if saved state is from today AND using same generations
            const savedGens = parsedState.generations || [];
            const gensMatch = JSON.stringify(savedGens.sort()) === JSON.stringify(gens.sort());
            
            if (parsedState.date === today && gensMatch) {
              console.log('Using saved game state with matching generations');
              
              // We still need to fetch the target Pokémon for this day
              const params = new URLSearchParams({
                date: localDate,
                generations: gens.join(','),
                t: Date.now().toString() // Cache busting
              });
              
              const response = await fetch(`/api/daily?${params}`, {
                headers: {
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0'
                }
              });
              
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
              setIsLoading(false);
              return;
            } else {
              console.log('Saved state date different or generations changed, fetching new Pokémon');
            }
          } catch (parseError) {
            console.error('Failed to parse saved game state:', parseError);
          }
        }
      }

      // Fetch daily Pokemon with selected generations, local date, and cache busting
      const params = new URLSearchParams({
        date: localDate,
        generations: gens.join(','),
        t: Date.now().toString() // Add timestamp to prevent caching
      });
      
      console.log('Requesting Pokémon with params:', params.toString());
      
      const response = await fetch(`/api/daily?${params}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch daily pokemon');
      }
      
      const data = await response.json();
      if (!data.pokemon) {
        throw new Error('No pokemon data received');
      }
      
      console.log('Received Pokémon:', data.pokemon.name, 'ID:', data.pokemon.id);

      // Set yesterday's Pokemon
      if (data.yesterdayPokemon) {
        setYesterdaysPokemon(data.yesterdayPokemon);
      }

      // Store whether this is the global daily or a generation-specific one
      setIsGlobalDaily(data.isGlobalDaily || false);

      // Save the generations used for this game
      saveGameGenerations(gens);

      // Reset the game state completely
      setTargetPokemon(data.pokemon);
      setGuesses([]);
      setGameState('playing');
      
      // Reset the streak updated ref for the new game
      streakUpdatedRef.current = false;
      gameCompletedRef.current = false;

      // Load streak from localStorage (only if this is a new session)
      if (!forceRefresh) {
        const savedStreak = safeLocalStorage.getItem('pokedle-streak') || '0';
        setStreak(parseInt(savedStreak));
      }

    } catch (error) {
      console.error('Error fetching target pokemon:', error);
      setErrorMessage('Failed to load the daily Pokemon. Please try refreshing.');
    } finally {
      setIsLoading(false);
      resetInProgressRef.current = false;
    }
  }, [selectedGenerations, safeLocalStorage]);

  // Initial fetch - fixed to avoid ESLint warning
  const hasSelectedGenerations = selectedGenerations.length > 0;
  useEffect(() => {
    if (hasSelectedGenerations) {
      fetchDailyPokemon();
    }
  }, [fetchDailyPokemon, hasSelectedGenerations]);

  // Save game state to localStorage
  useEffect(() => {
    // Skip during SSR, when targetPokemon is not set, or during reset
    if (typeof window === 'undefined' || !targetPokemon || resetInProgressRef.current) return;

    // Only save state when game state changes or guesses are made
    const gameStateToSave = {
      date: new Date().toDateString(),
      guesses,
      streak,
      gameState,
      targetPokemonId: targetPokemon.id,
      generations: selectedGenerations // Save the current generations
    };

    safeLocalStorage.setItem('pokedle-game-state', JSON.stringify(gameStateToSave));
  }, [guesses, gameState, streak, targetPokemon, selectedGenerations, safeLocalStorage]);

  // Save streak and game state to localStorage - only once per game
  useEffect(() => {
    // Skip during SSR
    if (typeof window === 'undefined') return;
    
    // Only update if the game state changed from playing to won/lost
    if ((gameState === 'won' || gameState === 'lost') && !streakUpdatedRef.current) {
      // Store the game completion status
      gameCompletedRef.current = true;

      // Get local date for API consistency
      const localDate = new Date().toISOString().split('T')[0];

      // Check if streak was already updated today
      const today = new Date().toDateString();
      const lastStreakDate = safeLocalStorage.getItem('pokedle-last-streak-date');
      
      // Update API that game is completed
      fetch(`/api/daily/complete?date=${localDate}`, {
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
          safeLocalStorage.setItem('pokedle-streak', newStreak.toString());
          // Record today's date for streak update
          safeLocalStorage.setItem('pokedle-last-streak-date', today);
        } else {
          // Reset streak on loss
          setStreak(0);
          safeLocalStorage.setItem('pokedle-streak', '0');
          // Record today's date for streak update
          safeLocalStorage.setItem('pokedle-last-streak-date', today);
        }
      }

      // Record today's date regardless of win/loss
      safeLocalStorage.setItem('pokedle-last-played', today);
      // Mark streak as updated to prevent multiple updates
      streakUpdatedRef.current = true;
    }
  }, [gameState, streak, safeLocalStorage]);

  // Guess handling
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

  // Random guess functionality
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
      params.set('generations', activeGenerationsRef.current.join(','));
      params.set('t', Date.now().toString()); // Cache busting
      
      const response = await fetch(`/api/random?${params}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

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
    // Mark reset as in progress to prevent state updates during reset
    resetInProgressRef.current = true;
    
    // First clear any pending timers
    if (generationsChangeTimerRef.current) {
      clearTimeout(generationsChangeTimerRef.current);
      generationsChangeTimerRef.current = null;
    }
    
    // Step 1: Set loading state and clear UI
    setTargetPokemon(null);
    setIsLoading(true);
    
    // Step 2: Clear localStorage game state
    safeLocalStorage.removeItem('pokedle-game-state');
    
    // Step 3: Reset all state variables in memory
    setGuesses([]);
    setGameState('playing');
    streakUpdatedRef.current = false;
    gameCompletedRef.current = false;
    
    // Step 4: Force a page reload to ensure everything is fresh
    // This is the most reliable way to ensure a complete reset
    window.location.reload();
    
  }, [safeLocalStorage]);

  // Generations change handler
  const handleGenerationsChange = useCallback((generations: number[]) => {
    // Only allow generation changes if the game is not complete
    if (gameState !== 'playing') return;
    
    console.log('Generation change requested to:', generations);
    
    // Skip if generations haven't actually changed
    if (JSON.stringify(generations.sort()) === JSON.stringify(activeGenerationsRef.current.sort())) {
      console.log('Generations unchanged, skipping update');
      return;
    }
    
    // Mark reset as in progress
    resetInProgressRef.current = true;
    
    // Save the selected generations immediately
    saveSelectedGenerations(generations);
    setSelectedGenerations(generations);
    
    // Update active generations ref immediately
    activeGenerationsRef.current = [...generations];
    
    // Clear any previous timer
    if (generationsChangeTimerRef.current) {
      clearTimeout(generationsChangeTimerRef.current);
      generationsChangeTimerRef.current = null;
    }
    
    // Step 1: Set loading state and clear UI
    setTargetPokemon(null);
    setIsLoading(true);
    
    // Step 2: Clear localStorage game state
    safeLocalStorage.removeItem('pokedle-game-state');
    
    // Step 3: Reset all state variables in memory
    setGuesses([]);
    setGameState('playing');
    streakUpdatedRef.current = false;
    gameCompletedRef.current = false;
    
    // Add a short delay to ensure state updates have processed
    generationsChangeTimerRef.current = setTimeout(() => {
      // Step 4: Fetch a new Pokémon with the new generations
      // Pass forceRefresh=true to ensure we get a fresh pokemon
      fetchDailyPokemon(generations, true);
      generationsChangeTimerRef.current = null;
    }, 100);
    
  }, [fetchDailyPokemon, gameState, safeLocalStorage]);
  
  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (generationsChangeTimerRef.current) {
        clearTimeout(generationsChangeTimerRef.current);
      }
      if (dateCheckIntervalRef.current) {
        clearInterval(dateCheckIntervalRef.current);
      }
    };
  }, []);

  if (errorMessage) {
    return (
      <div className="error-container">
        <div className="error-content">
          <p className="error-message">{errorMessage}</p>
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
          isGlobalDaily={isGlobalDaily}
        />

        {targetPokemon ? (
          <div className="game-result-container" key={targetPokemon.id}>
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

// Use Next.js dynamic import to skip SSR for this component
export default dynamic(() => Promise.resolve(HomePage), {
  ssr: false
});