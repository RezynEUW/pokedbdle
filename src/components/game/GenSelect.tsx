// /src/components/game/GenSelect.tsx
'use client';

import React, { useState, useEffect } from 'react';
import './GenSelect.css';

interface GenSelectProps {
  onGenerationsChange: (gens: number[]) => void;
}

const GenSelect: React.FC<GenSelectProps> = ({ onGenerationsChange }) => {
  const [selectedGens, setSelectedGens] = useState<number[]>(() => {
    // Initialize with all generations selected (1-9)
    const saved = localStorage.getItem('pokedle-generations');
    return saved ? JSON.parse(saved) : Array.from({ length: 9 }, (_, i) => i + 1);
  });

  const toggleGeneration = (gen: number) => {
    setSelectedGens(prev => {
      const newGens = prev.includes(gen)
        ? prev.filter(g => g !== gen)
        : [...prev, gen].sort((a, b) => a - b);
      
      // Ensure at least one generation is selected
      if (newGens.length === 0) {
        return prev;
      }
      
      localStorage.setItem('pokedle-generations', JSON.stringify(newGens));
      onGenerationsChange(newGens);
      return newGens;
    });
  };

  const isSelected = (gen: number) => selectedGens.includes(gen);

  return (
    <div className="gen-select">
      <div className="gen-grid">
        {/* Row 1: Gens 1-5 */}
        {[1, 2, 3, 4, 5].map(gen => (
          <button
            key={gen}
            className={`gen-button ${isSelected(gen) ? 'selected' : ''}`}
            onClick={() => toggleGeneration(gen)}
            title={`Generation ${gen}`}
          >
            {gen}
          </button>
        ))}
        {/* Row 2: Gens 6-9 + All */}
        {[6, 7, 8, 9].map(gen => (
          <button
            key={gen}
            className={`gen-button ${isSelected(gen) ? 'selected' : ''}`}
            onClick={() => toggleGeneration(gen)}
            title={`Generation ${gen}`}
          >
            {gen}
          </button>
        ))}
        <button
          className="gen-button all"
          onClick={() => {
            const allGens = Array.from({ length: 9 }, (_, i) => i + 1);
            setSelectedGens(allGens);
            localStorage.setItem('pokedle-generations', JSON.stringify(allGens));
            onGenerationsChange(allGens);
          }}
          title="All Generations"
        >
          All
        </button>
      </div>
    </div>
  );
};

export default GenSelect;