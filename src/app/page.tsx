// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { PokemonDisplay } from "@/components/game/PokemonDisplay";
import { PokemonAutocomplete } from "@/components/game/PokemonAutocomplete";
import { GuessHints } from "@/components/game/GuessHints";
import { DailyStats } from "@/components/game/DailyStats";
import { compareGuess } from "@/lib/game/gameLogic";
import type { Pokemon, HintResult, GameStats } from "@/types/game";

export default function Home() {
  const [targetPokemon, setTargetPokemon] = useState<Pokemon | null>(null);
  const [pokemonNames, setPokemonNames] = useState<Pokemon[]>([]);
  const [hints, setHints] = useState<HintResult[]>([]);
  const [guesses, setGuesses] = useState<Pokemon[]>([]);
  const [isRevealed, setIsRevealed] = useState(false);
  const [guessCount, setGuessCount] = useState(0);
  const [gameDate, setGameDate] = useState<string | null>(null);
  const [stats, setStats] = useState<GameStats>({
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: {}
  });

  useEffect(() => {
    const loadGameState = () => {
      const savedState = localStorage.getItem('pokedbdle_game_state');
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        const today = new Date().toISOString().split('T')[0];
        
        // Check if the saved state is for today
        if (parsedState.date === today) {
          setHints(parsedState.hints);
          setGuesses(parsedState.guesses);
          setIsRevealed(parsedState.isRevealed);
          setGuessCount(parsedState.guessCount);
          setGameDate(parsedState.date);
        }
      }
    };

    const fetchDailyPokemon = async () => {
      try {
        const response = await fetch('/api/daily');
        const data = await response.json();
        setTargetPokemon(data.pokemon);
        setGameDate(new Date().toISOString().split('T')[0]);
      } catch (error) {
        console.error('Error fetching daily pokemon:', error);
      }
    };

    const loadStats = () => {
      const savedStats = localStorage.getItem('pokedbdle_stats');
      if (savedStats) {
        setStats(JSON.parse(savedStats));
      }
    };

    // Fetch Pokemon names
    const fetchPokemonNames = async () => {
      try {
        const response = await fetch('/api/pokemon-names');
        const data = await response.json();

        // Debug log to see what we actually get from the API
        console.log("pokemon-names =>", data);

        // Ensure we got an array before calling setPokemonNames
        if (!Array.isArray(data)) {
          console.error("Expected an array from /api/pokemon-names, got:", data);
          return;
        }

        setPokemonNames(data);
      } catch (error) {
        console.error('Error fetching Pokemon names:', error);
      }
    };

    loadStats();
    loadGameState();
    fetchDailyPokemon();
    fetchPokemonNames();
  }, []);

  // Save game state whenever it changes
  useEffect(() => {
    if (targetPokemon && gameDate) {
      const gameState = {
        date: gameDate,
        hints,
        guesses,
        isRevealed,
        guessCount
      };
      localStorage.setItem('pokedbdle_game_state', JSON.stringify(gameState));
    }
  }, [hints, guesses, isRevealed, guessCount, targetPokemon, gameDate]);

  const saveStats = (newStats: GameStats) => {
    localStorage.setItem('pokedbdle_stats', JSON.stringify(newStats));
    setStats(newStats);
  };

  const handleGuess = async (guessName: string) => {
    if (!targetPokemon) return;

    try {
      const response = await fetch(`/api/guess?name=${encodeURIComponent(guessName)}`);
      const guessPokemon: Pokemon = await response.json();
      
      const result = compareGuess(guessPokemon, targetPokemon);
      
      // Ensure hints is always an array
      const newHints = Array.isArray(result.hints) ? result.hints : [];
      
      // Update guesses and hints
      setGuesses(prev => {
        const currentGuesses = Array.isArray(prev) ? prev : [];
        return [...currentGuesses, guessPokemon];
      });

      setHints(prev => {
        const currentHints = Array.isArray(prev) ? prev : [];
        return [...currentHints, ...newHints];
      });

      setGuessCount(prev => (prev || 0) + 1);

      if (result.isCorrect) {
        handleWin();
      }
    } catch (error) {
      console.error('Error processing guess:', error);
    }
  };

  const handleWin = () => {
    setIsRevealed(true);
    const newStats = {
      ...stats,
      gamesPlayed: stats.gamesPlayed + 1,
      gamesWon: stats.gamesWon + 1,
      currentStreak: stats.currentStreak + 1,
      maxStreak: Math.max(stats.maxStreak, stats.currentStreak + 1),
      guessDistribution: {
        ...stats.guessDistribution,
        [guessCount]: (stats.guessDistribution[guessCount] || 0) + 1
      }
    };
    saveStats(newStats);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex flex-col items-center">
      <div className="w-full max-w-4xl px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-center text-blue-800 drop-shadow-md">
            PokéDBDle
          </h1>
        </header>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid md:grid-cols-2 gap-6 p-6">
            <div className="space-y-6">
              <PokemonDisplay 
                sprite={targetPokemon?.sprite_official} 
                isRevealed={isRevealed}
                className="mx-auto"
              />
              <PokemonAutocomplete 
                pokemonNames={pokemonNames}
                onGuess={handleGuess}
                disabled={isRevealed}
                className="w-full"
              />
            </div>
            
            <div className="space-y-6">
              <GuessHints 
                guesses={guesses} 
                className="border rounded-lg overflow-hidden"
              />
              <DailyStats 
                stats={stats} 
                className="bg-gray-50 rounded-lg p-4"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
