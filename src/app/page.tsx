// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { PokemonSearch } from '@/components/game/PokemonSearch';
import { GuessGrid } from '@/components/game/GuessGrid';
import { Pokemon } from '@/types/pokemon';

export default function Home() {
  const [guesses, setGuesses] = useState<Pokemon[]>([]);
  const [targetPokemon, setTargetPokemon] = useState<Pokemon | null>(null);

  useEffect(() => {
    // Fetch target Pokemon on component mount
    const fetchTargetPokemon = async () => {
      try {
        const response = await fetch('/api/daily');
        const data = await response.json();
        setTargetPokemon(data.pokemon);
      } catch (error) {
        console.error('Error fetching target pokemon:', error);
      }
    };

    fetchTargetPokemon();
  }, []);

  const handleGuess = async (pokemon: Pokemon) => {
    setGuesses(prev => [...prev, pokemon]);
  };

  if (!targetPokemon) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-black">
      <header className="p-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white">Pokédle</h1>
      </header>

      <main className="p-4">
        <div className="max-w-6xl mx-auto space-y-4">
          <PokemonSearch onSelect={handleGuess} />
          <GuessGrid guesses={guesses} target={targetPokemon} />
        </div>
      </main>
    </div>
  );
}