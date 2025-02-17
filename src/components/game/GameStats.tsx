// src/components/game/GameStats.tsx
import React from 'react';
import { GameStats } from '@/types/game';

interface GameStatsModalProps {
  stats: GameStats;
  isOpen: boolean;
  onClose: () => void;
}

export function GameStatsModal({ 
  stats, 
  isOpen, 
  onClose 
}: GameStatsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Game Statistics</h2>
          <button 
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <StatItem label="Games Played" value={stats.gamesPlayed} />
          <StatItem label="Games Won" value={stats.gamesWon} />
          <StatItem label="Current Streak" value={stats.currentStreak} />
          <StatItem label="Max Streak" value={stats.maxStreak} />

          <div>
            <h3 className="font-semibold mb-2">Guess Distribution</h3>
            <div className="space-y-2">
              {Object.entries(stats.guessDistribution).map(([guessCount, frequency]) => (
                <div key={guessCount} className="flex items-center">
                  <span className="mr-2">{guessCount} guesses:</span>
                  <div 
                    className="bg-blue-500 h-4 rounded"
                    style={{ width: `${(frequency / Math.max(...Object.values(stats.guessDistribution))) * 100}%` }}
                  />
                  <span className="ml-2 text-sm">{frequency}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string, value: number }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

export default GameStatsModal;