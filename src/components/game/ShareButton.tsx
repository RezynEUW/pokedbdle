'use client';

import React, { useState } from 'react';
import { Pokemon } from '@/types/pokemon';
import './ShareButton.css';

interface ShareButtonProps {
  guesses: Pokemon[];
  target: Pokemon;
  guessCount: number;
}

const ShareButton: React.FC<ShareButtonProps> = ({ guesses, target, guessCount }) => {
  const [showToast, setShowToast] = useState(false);

  const generateShareText = () => {
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Create the header line
    let shareText = `Pokédle ${dateStr} - ${guessCount}/${guessCount} guesses\n\n`;
    
    // Add emoji grid representation of guesses - only include actual guesses, not the images
    const actualGuesses = guesses.filter(g => g.id !== 0); // Filter out any placeholders
    
    actualGuesses.forEach((guess) => {
      // For each guess, create a row of emojis representing the comparison
      let emojiRow = '';
      
      // Primary type match (first type in the array)
      const guessPrimaryType = guess.types[0] || '';
      const targetPrimaryType = target.types[0] || '';
      const targetSecondaryType = target.types[1] || '';

      if (guessPrimaryType === targetPrimaryType) {
        emojiRow += '🟩';
      } else if (targetSecondaryType && guessPrimaryType === targetSecondaryType) {
        emojiRow += '🟨';
      } else {
        emojiRow += '⬛';
      }
      
      // Secondary type match (second type in the array, if any)
      const guessSecondaryType = guess.types[1] || '';
      
      if (guessSecondaryType && guessSecondaryType === targetSecondaryType) {
        emojiRow += '🟩';
      } else if (guessSecondaryType && guessSecondaryType === targetPrimaryType) {
        emojiRow += '🟨';
      } else {
        emojiRow += '⬛';
      }
      
      // Generation match
      emojiRow += guess.generation === target.generation ? '🟩' : '⬛';
      
      // Color match
      emojiRow += guess.color === target.color ? '🟩' : '⬛';
      
      // Evolution stage
      emojiRow += guess.evolution_stage === target.evolution_stage ? '🟩' : '⬛';
      
      // Height with solid value margin (0.3 meters)
      if (guess.height === target.height) {
        emojiRow += '🟩';
      } else {
        // Use solid value margin of 0.3 meters
        const heightDifference = Math.abs(guess.height - target.height);
        if (heightDifference <= 0.3) {
          emojiRow += '🟨'; // Partial match (yellow)
        } else {
          emojiRow += '⬛'; // No match
        }
      }
      
      // Weight with solid value margin (10 kg)
      if (guess.weight === target.weight) {
        emojiRow += '🟩';
      } else {
        // Use solid value margin of 10 kg
        const weightDifference = Math.abs(guess.weight - target.weight);
        if (weightDifference <= 10) {
          emojiRow += '🟨'; // Partial match (yellow)
        } else {
          emojiRow += '⬛'; // No match
        }
      }
      
      // Base stat total with solid value margin (50 points)
      if (guess.base_stat_total === target.base_stat_total) {
        emojiRow += '🟩';
      } else {
        // Use solid value margin of 50 points
        const bstDifference = Math.abs(guess.base_stat_total - target.base_stat_total);
        if (bstDifference <= 50) {
          emojiRow += '🟨'; // Partial match (yellow)
        } else {
          emojiRow += '⬛'; // No match
        }
      }
      
      // Abilities (matching at least one)
      const hasMatchingAbility = guess.abilities.some(ability => 
        target.abilities.includes(ability)
      );
      emojiRow += hasMatchingAbility ? '🟩' : '⬛';
      
      // Egg Groups (matching at least one)
      const hasMatchingEggGroup = guess.egg_groups.some(group => 
        target.egg_groups.includes(group)
      );
      emojiRow += hasMatchingEggGroup ? '🟩' : '⬛';
      
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