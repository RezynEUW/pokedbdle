// src/components/game/PokemonDisplay.tsx
'use client';

import Image from 'next/image';
import { useState } from 'react';

interface PokemonDisplayProps {
  sprite?: string;
  isRevealed?: boolean;
  className?: string;
}

export function PokemonDisplay({ 
  sprite, 
  isRevealed = false,
  className = '' 
}: PokemonDisplayProps) {
  return (
    <div className={`relative aspect-square w-full max-w-md mx-auto bg-gray-100 rounded-lg overflow-hidden shadow-md ${className}`}>
      <div className={`
        absolute inset-0 flex items-center justify-center
        transition-all duration-500 ease-in-out
        ${!isRevealed ? 'filter brightness-0 scale-90' : 'filter brightness-100 scale-100'}
      `}>
        <Image
          src={sprite || '/placeholder-pokemon.png'}
          alt="Mystery Pokemon"
          fill
          className="object-contain p-4"
          priority
        />
      </div>
      {!isRevealed && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 100 100" 
            className="w-1/2 h-1/2 text-white opacity-50"
          >
            <path 
              d="M50 25 A25 25 0 0 1 50 75 A25 25 0 0 1 50 25 M50 40 L80 60 M50 40 L20 60" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="5"
            />
          </svg>
        </div>
      )}
    </div>
  );
}