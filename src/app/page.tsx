// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { PokemonSearch } from '@/components/game/PokemonSearch';
import GuessGrid from '@/components/game/GuessGrid';
import { Pokemon } from '@/types/pokemon';

export default function Home() {
  const [guesses, setGuesses] = useState<Pokemon[]>([]);
  const [targetPokemon, setTargetPokemon] = useState<Pokemon | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTargetPokemon = async () => {
      try {
        const response = await fetch('/api/daily');
        if (!response.ok) {
          throw new Error('Failed to fetch daily pokemon');
        }
        const data = await response.json();
        if (!data.pokemon) {
          throw new Error('No pokemon data received');
        }
        setTargetPokemon(data.pokemon);
      } catch (error) {
        console.error('Error fetching target pokemon:', error);
        setError('Failed to load the daily Pokemon. Please try refreshing.');
      }
    };

    fetchTargetPokemon();
  }, []);

  const handleGuess = async (pokemon: Pokemon) => {
    if (!targetPokemon) return;
    
    // Prevent duplicate guesses
    if (guesses.some(g => g.name === pokemon.name)) {
      return;
    }

    setGuesses(prev => [...prev, pokemon]);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
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
        <PokemonSearch 
          onSelect={handleGuess}
          disabled={!targetPokemon}
        />
        {targetPokemon ? (
          <GuessGrid guesses={guesses} target={targetPokemon} />
        ) : (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </main>
    </div>
  );
}