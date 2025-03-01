'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  
  // Track if this is a user-initiated change
  const isUserChange = useRef(false);

  const [selectedGens, setSelectedGens] = useState<number[]>(() => {
    // Initialize with provided generations, fallback to saved generations or all
    if (externalSelectedGens && externalSelectedGens.length > 0) {
      lastExternalGensRef.current = [...externalSelectedGens];
      return externalSelectedGens;
    }
    
    // Initialize with all generations selected (1-9)
    try {
      const saved = localStorage.getItem('pokedle-generations');
      const initialGens = saved ? JSON.parse(saved) : Array.from({ length: 9 }, (_, i) => i + 1);
      lastExternalGensRef.current = [...initialGens];
      return initialGens;
    } catch (error) {
      // Fallback to all generations if localStorage access fails
      console.error('Error accessing localStorage:', error);
      const defaultGens = Array.from({ length: 9 }, (_, i) => i + 1);
      lastExternalGensRef.current = [...defaultGens];
      return defaultGens;
    }
  });

  // Memoize the health check function to prevent recreation on every render
  const healthCheck = useCallback(() => {
    try {
      // Fetch the current saved generations from localStorage
      const saved = localStorage.getItem('pokedle-generations');
      let storedGens: number[] = [];
      
      if (saved) {
        storedGens = JSON.parse(saved);
      } else {
        storedGens = Array.from({ length: 9 }, (_, i) => i + 1);
      }
      
      // Compare with current state and force update if different
      if (JSON.stringify(storedGens) !== JSON.stringify(selectedGens)) {
        setSelectedGens(storedGens);
        lastExternalGensRef.current = [...storedGens];
      }
    } catch (error) {
      console.error('GenSelect health check error:', error);
      // Simplified error handling
      const defaultGens = Array.from({ length: 9 }, (_, i) => i + 1);
      setSelectedGens(defaultGens);
      lastExternalGensRef.current = [...defaultGens];
      
      // Try to save the default generations
      try {
        saveSelectedGenerations(defaultGens);
      } catch (e) {
        console.error('Failed to save default generations:', e);
      }
    }
  }, [selectedGens]);
  
  // One-time setup of health check interval
  useEffect(() => {
    // Less frequent health check (15 minutes instead of 5)
    const interval = setInterval(healthCheck, 15 * 60 * 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, [healthCheck]);

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
    
    try {
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
    } catch (error) {
      console.error('Error toggling generation:', error);
    }
  };

  const handleSelectAll = () => {
    if (disabled) return;
    
    try {
      isUserChange.current = true;
      const allGens = Array.from({ length: 9 }, (_, i) => i + 1);
      setSelectedGens(allGens);
      saveSelectedGenerations(allGens);
    } catch (error) {
      console.error('Error selecting all generations:', error);
    }
  };

  const isSelected = (gen: number) => {
    try {
      return selectedGens.includes(gen);
    } catch (error) {
      console.error('Error checking if generation is selected:', error);
      return false;
    }
  };

  return (
    <div className={`gen-select ${disabled ? 'disabled' : ''}`}>
      <div className="generation-label">Generation</div>
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