'use client';

import React, { useState, useEffect, useRef } from 'react';
import { saveSelectedGenerations } from '@/lib/game/storage';
import './GenSelect.css';

interface GenSelectProps {
  onGenerationsChange: (gens: number[]) => void;
  selectedGenerations?: number[];
  disabled?: boolean;
}

const GenSelect: React.FC<GenSelectProps> = ({ 
  onGenerationsChange, 
  selectedGenerations: externalSelectedGens,
  disabled = false 
}) => {
  // Keep track of the last value we received from props to avoid infinite loops
  const lastExternalGensRef = useRef<number[]>([]);
  
  const [selectedGens, setSelectedGens] = useState<number[]>(() => {
    // Initialize with provided generations, fallback to saved generations or all
    if (externalSelectedGens && externalSelectedGens.length > 0) {
      lastExternalGensRef.current = [...externalSelectedGens];
      return externalSelectedGens;
    }
    // Initialize with all generations selected (1-9)
    const saved = localStorage.getItem('pokedle-generations');
    const initialGens = saved ? JSON.parse(saved) : Array.from({ length: 9 }, (_, i) => i + 1);
    lastExternalGensRef.current = [...initialGens];
    return initialGens;
  });

  // Track if this is a user-initiated change
  const isUserChange = useRef(false);

  // Update internal state when external props change, but only if they're different
  useEffect(() => {
    if (externalSelectedGens && 
        JSON.stringify(externalSelectedGens) !== JSON.stringify(lastExternalGensRef.current)) {
      lastExternalGensRef.current = [...externalSelectedGens];
      setSelectedGens(externalSelectedGens);
      isUserChange.current = false;
    }
  }, [externalSelectedGens]);

  // Only notify parent about changes when they come from user interaction
  useEffect(() => {
    if (isUserChange.current && 
        JSON.stringify(selectedGens) !== JSON.stringify(lastExternalGensRef.current)) {
      lastExternalGensRef.current = [...selectedGens];
      onGenerationsChange(selectedGens);
      isUserChange.current = false;
    }
  }, [selectedGens, onGenerationsChange]);

  const toggleGeneration = (gen: number) => {
    if (disabled) return;
    
    isUserChange.current = true;
    setSelectedGens(prev => {
      const newGens = prev.includes(gen)
        ? prev.filter(g => g !== gen)
        : [...prev, gen].sort((a, b) => a - b);
      
      // Ensure at least one generation is selected
      if (newGens.length === 0) {
        return prev;
      }
      
      saveSelectedGenerations(newGens);
      return newGens;
    });
  };

  const handleSelectAll = () => {
    if (disabled) return;
    
    isUserChange.current = true;
    const allGens = Array.from({ length: 9 }, (_, i) => i + 1);
    setSelectedGens(allGens);
    saveSelectedGenerations(allGens);
  };

  const isSelected = (gen: number) => selectedGens.includes(gen);

  return (
    <div className={`gen-select ${disabled ? 'disabled' : ''}`}>
      <div className="gen-grid">
        {/* Row 1: Gens 1-5 */}
        {[1, 2, 3, 4, 5].map(gen => (
          <button
            key={gen}
            className={`gen-button ${isSelected(gen) ? 'selected' : ''}`}
            onClick={() => toggleGeneration(gen)}
            title={`Generation ${gen}${disabled ? ' (Disabled during completed game)' : ''}`}
            disabled={disabled}
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
            title={`Generation ${gen}${disabled ? ' (Disabled during completed game)' : ''}`}
            disabled={disabled}
          >
            {gen}
          </button>
        ))}
        <button
          className={`gen-button all ${selectedGens.length === 9 ? 'selected' : ''}`}
          onClick={handleSelectAll}
          title={`All Generations${disabled ? ' (Disabled during completed game)' : ''}`}
          disabled={disabled}
        >
          All
        </button>
      </div>
    </div>
  );
};

export default GenSelect;