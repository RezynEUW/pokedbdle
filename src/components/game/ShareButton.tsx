'use client';

import React, { useState } from 'react';
import { Pokemon } from '@/types/pokemon';
import './ShareButton.css';

interface ShareButtonProps {
  guesses: Pokemon[];
  target: Pokemon;
  guessCount: number;
  selectedGenerations?: number[];
}

const ShareButton: React.FC<ShareButtonProps> = ({ 
  guesses, 
  target, 
  guessCount, 
  selectedGenerations = []
}) => {
  const [showToast, setShowToast] = useState(false);

  const generateShareText = () => {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Create the simplified header line
    let shareText = `Pokédle ${dateStr} - ${guessCount} guesses`;
    
    // Add generations info - check if all generations (1-9) are selected
    const allGens = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const sortedGens = [...selectedGenerations].sort((a, b) => a - b);
    
    // Convert to strings for comparison
    const allGensStr = JSON.stringify(allGens);
    const sortedGensStr = JSON.stringify(sortedGens);
    
    if (selectedGenerations.length > 0) {
      // Check if all generations are selected (1-9)
      if (allGensStr === sortedGensStr || 
          (selectedGenerations.length === 9 && 
           selectedGenerations.every(gen => gen >= 1 && gen <= 9))) {
        // All generations
        shareText += ` - Classic`;
      } else {
        // Only some generations
        shareText += ` - (Gen ${sortedGens.join(',')})`;
      }
    }
    
    shareText += '\n\n';
    
    // Add emoji grid representation of guesses - only include actual guesses, not images
    // Filter and reverse to show latest guess at the top
    const actualGuesses = guesses
      .filter(g => g.id !== 0) // Filter out any placeholders
      .slice() // Create a copy to avoid mutating the original array
      .reverse(); // Reverse so the latest/correct guess is at the top
    
    actualGuesses.forEach((guess) => {
      // For each guess, create a row of emojis representing the comparison
      let emojiRow = '';
      
      // COLUMN 1: Types - Combined into a single column
      const guessTypes = guess.types || [];
      const targetTypes = target.types || [];
      
      // Check for exact match (both types match exactly)
      const exactMatch = 
        (guessTypes.length === targetTypes.length) && 
        guessTypes.every(type => targetTypes.includes(type)) &&
        targetTypes.every(type => guessTypes.includes(type));
      
      // Check for partial match (at least one type matches)
      const partialMatch = !exactMatch && guessTypes.some(type => targetTypes.includes(type));
      
      if (exactMatch) {
        emojiRow += '🟩';
      } else if (partialMatch) {
        emojiRow += '🟨';
      } else {
        emojiRow += '⬛';
      }
      
      // COLUMN 2: Generation match
      emojiRow += guess.generation === target.generation ? '🟩' : '⬛';
      
      // COLUMN 3: Color match
      emojiRow += guess.color === target.color ? '🟩' : '⬛';
      
      // COLUMN 4: Evolution stage
      emojiRow += guess.evolution_stage === target.evolution_stage ? '🟩' : '⬛';
      
      // COLUMN 5: Height with partial match within 0.3 meters (3 decimeters)
      if (guess.height === target.height) {
        emojiRow += '🟩';
      } else {
        // Calculate if within margin
        const heightDifference = Math.abs(guess.height - target.height);
        if (heightDifference <= 3) {
          emojiRow += '🟨'; // Partial match (yellow)
        } else {
          emojiRow += '⬛'; // No match
        }
      }
      
      // COLUMN 6: Weight with partial match within 10 kg (100 hectograms)
      if (guess.weight === target.weight) {
        emojiRow += '🟩';
      } else {
        // Calculate if within margin
        const weightDifference = Math.abs(guess.weight - target.weight);
        if (weightDifference <= 100) {
          emojiRow += '🟨'; // Partial match (yellow)
        } else {
          emojiRow += '⬛'; // No match
        }
      }
      
      // COLUMN 7: Base stat total with partial match within 50 points
      if (guess.base_stat_total === target.base_stat_total) {
        emojiRow += '🟩';
      } else {
        // Calculate if within margin
        const bstDifference = Math.abs(guess.base_stat_total - target.base_stat_total);
        if (bstDifference <= 50) {
          emojiRow += '🟨'; // Partial match (yellow)
        } else {
          emojiRow += '⬛'; // No match
        }
      }
      
      // COLUMN 8: Egg Groups (matching at least one)
      const hasMatchingEggGroup = guess.egg_groups.some(group => 
        target.egg_groups.includes(group)
      );
      emojiRow += hasMatchingEggGroup ? '🟩' : '⬛';
      
      // COLUMN 9: Abilities (matching at least one)
      const hasMatchingAbility = guess.abilities.some(ability => 
        target.abilities.includes(ability)
      );
      emojiRow += hasMatchingAbility ? '🟩' : '⬛';
      
      // Add this row to the share text
      shareText += emojiRow + '\n';
    });
    
    // Add URL
    shareText += '\nhttps://pokedle.day';
    
    return shareText;
  };

  const copyToClipboard = () => {
    const shareText = generateShareText();
    
    // Copy to clipboard
    try {
      // Modern clipboard API
      navigator.clipboard.writeText(shareText)
        .then(() => {
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
        })
        .catch(err => {
          console.error('Failed to copy using clipboard API:', err);
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = shareText;
          textArea.style.position = 'fixed';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          
          try {
            const successful = document.execCommand('copy');
            if (successful) {
              setShowToast(true);
              setTimeout(() => setShowToast(false), 3000);
            } else {
              alert('Could not copy results. Please try again.');
            }
          } catch (err) {
            console.error('Fallback copy failed:', err);
            alert('Could not copy results. Please try again.');
          }
          
          document.body.removeChild(textArea);
        });
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      alert('Could not copy results. Please try again.');
    }
  };

  return (
    <>
      <button 
        className="share-button" 
        onClick={copyToClipboard}
        title="Copy results to clipboard"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>
      
      {showToast && (
        <div className="share-toast">
          Results copied to clipboard!
        </div>
      )}
    </>
  );
};

export default ShareButton;