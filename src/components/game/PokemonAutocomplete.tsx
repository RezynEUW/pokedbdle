// src/components/game/PokemonAutocomplete.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import type { Pokemon } from "@/types/game";

interface PokemonAutocompleteProps {
  pokemonNames: Pokemon[];
  onGuess: (guess: string) => void;
  disabled?: boolean;
  className?: string;
}

export function PokemonAutocomplete({ 
  pokemonNames, 
  onGuess, 
  disabled = false,
  className = '' 
}: PokemonAutocompleteProps) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Pokemon[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (input.length > 1) {
      const filteredSuggestions = pokemonNames
        .filter(pokemon => 
          pokemon.name.toLowerCase().includes(input.toLowerCase())
        )
        .slice(0, 10);
      setSuggestions(filteredSuggestions);
      setShowSuggestions(filteredSuggestions.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [input, pokemonNames]);

  // Handle clicks outside the input and suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = (selectedPokemon?: Pokemon) => {
    const nameToGuess = selectedPokemon ? selectedPokemon.name : input;
    if (nameToGuess.trim()) {
      onGuess(nameToGuess.trim().toLowerCase());
      setInput('');
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && suggestions.length > 0) {
      handleSubmit(suggestions[0]);
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div className="flex shadow-md rounded-lg overflow-hidden">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setShowSuggestions(suggestions.length > 0)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Enter Pokemon name..."
          className="flex-1 p-3 border-2 border-blue-200 focus:border-blue-500 transition-colors disabled:bg-gray-100"
        />
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={disabled || !input.trim()}
          className="px-6 py-3 bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:bg-gray-300"
        >
          Guess
        </button>
      </div>
      {showSuggestions && (
        <div 
          ref={suggestionsRef}
          className="absolute z-10 w-full max-h-60 overflow-y-auto bg-white border border-gray-300 rounded-b-lg shadow-lg mt-1"
        >
          {suggestions.map((pokemon) => (
            <div
              key={pokemon.id}
              onClick={() => {
                setInput(pokemon.name);
                handleSubmit(pokemon);
              }}
              className="p-2 hover:bg-gray-100 cursor-pointer flex items-center space-x-3 transition-colors"
            >
              <Image 
                src={pokemon.sprite_thumbnail} 
                alt={pokemon.name} 
                width={40} 
                height={40} 
                className="w-10 h-10 object-contain"
              />
              <span className="font-medium">{pokemon.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}