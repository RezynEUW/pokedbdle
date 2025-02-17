// src/components/game/PokemonSearch.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Pokemon } from '@/types/pokemon';

interface PokemonSearchProps {
  onSelect: (pokemon: Pokemon) => void;
  disabled?: boolean;
}

export function PokemonSearch({ onSelect, disabled = false }: PokemonSearchProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Pokemon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchPokemon = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Search failed');
        const data = await response.json();
        setSuggestions(data);
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchPokemon, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (pokemon: Pokemon) => {
    onSelect(pokemon);
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div ref={searchContainerRef} className="search-container">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        disabled={disabled}
        placeholder="Enter Pokémon name..."
        className="search-input"
      />

      {showSuggestions && suggestions.length > 0 && (
        <ul className="suggestions-list">
          {suggestions.map((pokemon) => (
            <li
              key={`${pokemon.id}-${pokemon.name}`}
              onClick={() => handleSelect(pokemon)}
              className="suggestion-item"
            >
              <img
                src={pokemon.sprite_default}
                alt={pokemon.name}
                className="pokemon-suggestion-sprite"
              />
              <span className="pokemon-suggestion-name">{pokemon.name}</span>
            </li>
          ))}
        </ul>
      )}

      {isLoading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
}