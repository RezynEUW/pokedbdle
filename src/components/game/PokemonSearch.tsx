// src/components/game/PokemonSearch.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Pokemon } from '@/types/pokemon';
import { searchPokemon } from '@/lib/db/pokemon';

interface PokemonSearchProps {
  onSelect: (pokemon: Pokemon) => void;
  onClear?: () => void;
  disabled?: boolean;
  className?: string;
}

export function PokemonSearch({ 
  onSelect, 
  onClear,
  disabled = false, 
  className = '' 
}: PokemonSearchProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Pokemon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const searchPokemonDebounced = async () => {
      setIsLoading(true);
      try {
        const results = await searchPokemon(query);
        setSuggestions(results);
      } catch (error) {
        console.error('Error searching pokemon:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(searchPokemonDebounced, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    onClear && onClear();
    inputRef.current?.focus();
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          disabled={disabled}
          placeholder="Enter Pokémon name..."
          className="
            w-full p-3 pr-12 rounded-lg 
            bg-white text-black
            border border-gray-300 
            focus:outline-none focus:ring-2 focus:ring-blue-500
            placeholder-gray-500
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        />
        {query && (
          <button
            onClick={handleClear}
            className="
              absolute right-3 top-1/2 -translate-y-1/2
              text-gray-500 hover:text-gray-700
              focus:outline-none
            "
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {isFocused && suggestions.length > 0 && (
        <ul className="
          absolute z-10 w-full mt-1 
          bg-white border border-gray-300 rounded-lg 
          max-h-60 overflow-auto 
          shadow-lg divide-y divide-gray-100
        ">
          {suggestions.map((pokemon) => (
            <li
              key={pokemon.id}
              onClick={() => {
                onSelect(pokemon);
                setQuery('');
                setSuggestions([]);
              }}
              className="
                flex items-center p-2 
                hover:bg-gray-100 cursor-pointer 
                transition-colors
              "
            >
              <img
                src={pokemon.sprite_default}
                alt={pokemon.name}
                className="w-10 h-10 mr-3"
              />
              <span className="capitalize">{pokemon.name}</span>
            </li>
          ))}
        </ul>
      )}

      {isLoading && (
        <div className="absolute right-3 top-3">
          <div className="
            animate-spin h-5 w-5 
            border-2 border-blue-500 
            rounded-full border-t-transparent
          "></div>
        </div>
      )}
    </div>
  );
}