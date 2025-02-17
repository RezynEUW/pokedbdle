// src/components/game/GameHeader.tsx
import React, { useState } from 'react';
import { HelpIcon, StatsIcon, SettingsIcon } from '@/components/ui/Icons';
import { HelpModal } from './HelpModal';
import { GameStatsModal } from './GameStats';
import { SettingsModal } from './SettingsModal';

interface GameHeaderProps {
  onReset?: () => void;
}

export function GameHeader({ onReset }: GameHeaderProps) {
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Placeholder for game stats - replace with actual stats from game state
  const gameStats = {
    gamesPlayed: 10,
    gamesWon: 7,
    currentStreak: 3,
    maxStreak: 5,
    guessDistribution: {
      1: 0,
      2: 1,
      3: 2,
      4: 3,
      5: 1,
      6: 0,
      7: 0,
      8: 0
    },
    lastPlayed: new Date().toISOString()
  };

  return (
    <>
      <header className="flex justify-between items-center p-4 bg-gray-100">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold text-gray-800">Pokédle</h1>
          {onReset && (
            <button 
              onClick={onReset}
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setIsHelpModalOpen(true)}
            className="text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Help"
          >
            <HelpIcon size={24} />
          </button>
          
          <button 
            onClick={() => setIsStatsModalOpen(true)}
            className="text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Statistics"
          >
            <StatsIcon size={24} />
          </button>
          
          <button 
            onClick={() => setIsSettingsModalOpen(true)}
            className="text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Settings"
          >
            <SettingsIcon size={24} />
          </button>
        </div>
      </header>

      <HelpModal 
        isOpen={isHelpModalOpen} 
        onClose={() => setIsHelpModalOpen(false)} 
      />

      <GameStatsModal 
        isOpen={isStatsModalOpen} 
        onClose={() => setIsStatsModalOpen(false)} 
        stats={gameStats}
      />

      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
      />
    </>
  );
}

export default GameHeader;