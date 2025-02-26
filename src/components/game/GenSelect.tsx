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
  
  // Track the last time the component state changed
  const lastChangeTimeRef = useRef<number>(Date.now());
  
  // Track if there was an error in state synchronization
  const errorCountRef = useRef<number>(0);

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

  // Track if this is a user-initiated change
  const isUserChange = useRef(false);

  // Periodic health check for component state
  useEffect(() => {
    const healthCheck = () => {
      const now = Date.now();
      
      // If it's been more than 15 minutes since the last change
      if (now - lastChangeTimeRef.current > 15 * 60 * 1000) {
        console.log('GenSelect: Running health check');
        
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
            console.log('GenSelect: State mismatch detected, refreshing state');
            setSelectedGens(storedGens);
            lastExternalGensRef.current = [...storedGens];
            lastChangeTimeRef.current = now;
          }
        } catch (error) {
          console.error('GenSelect health check error:', error);
          errorCountRef.current += 1;
          
          // If we've had multiple errors, try to recover by resetting to default state
          if (errorCountRef.current > 3) {
            console.log('GenSelect: Multiple errors detected, attempting recovery');
            const defaultGens = Array.from({ length: 9 }, (_, i) => i + 1);
            setSelectedGens(defaultGens);
            lastExternalGensRef.current = [...defaultGens];
            lastChangeTimeRef.current = now;
            errorCountRef.current = 0;
            
            // Try to save the default generations
            try {
              saveSelectedGenerations(defaultGens);
            } catch (e) {
              console.error('Failed to save default generations:', e);
            }
          }
        }
      }
    };
    
    // Check every 5 minutes
    const interval = setInterval(healthCheck, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [selectedGens]);

  // Update internal state when external props change, but only if they're different
  useEffect(() => {
    if (externalSelectedGens && 
        JSON.stringify(externalSelectedGens) !== JSON.stringify(lastExternalGensRef.current)) {
      lastExternalGensRef.current = [...externalSelectedGens];
      setSelectedGens(externalSelectedGens);
      isUserChange.current = false;
      lastChangeTimeRef.current = Date.now();
    }
  }, [externalSelectedGens]);

  // Only notify parent about changes when they come from user interaction
  useEffect(() => {
    if (isUserChange.current && 
        JSON.stringify(selectedGens) !== JSON.stringify(lastExternalGensRef.current)) {
      lastExternalGensRef.current = [...selectedGens];
      onGenerationsChange(selectedGens);
      isUserChange.current = false;
      lastChangeTimeRef.current = Date.now();
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
        lastChangeTimeRef.current = Date.now();
        return newGens;
      });
    } catch (error) {
      console.error('Error toggling generation:', error);
      // Recovery attempt
      errorCountRef.current += 1;
    }
  };

  const handleSelectAll = () => {
    if (disabled) return;
    
    try {
      isUserChange.current = true;
      const allGens = Array.from({ length: 9 }, (_, i) => i + 1);
      setSelectedGens(allGens);
      saveSelectedGenerations(allGens);
      lastChangeTimeRef.current = Date.now();
    } catch (error) {
      console.error('Error selecting all generations:', error);
      // Recovery attempt
      errorCountRef.current += 1;
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