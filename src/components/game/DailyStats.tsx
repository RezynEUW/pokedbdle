// src/components/game/DailyStats.tsx
'use client';

interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: Record<number, number>;
}

interface DailyStatsProps {
  stats: GameStats;
  className?: string;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}

function GuessBar({ guesses, count, maxCount }: { guesses: number; count: number; maxCount: number }) {
  const percentage = maxCount ? (count / maxCount) * 100 : 0;
  
  return (
    <div className="flex items-center gap-2">
      <div className="w-4">{guesses}</div>
      <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
        <div 
          className="h-full bg-blue-500"
          style={{ width: `${percentage}%` }}
        >
          <div className="px-2 text-white leading-6">{count}</div>
        </div>
      </div>
    </div>
  );
}

export function DailyStats({ stats, className = "" }: DailyStatsProps) {
  const winRate = stats.gamesPlayed ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0;

  return (
    <div className={`p-4 bg-white rounded-lg shadow ${className}`}>
      <h2 className="text-xl font-semibold mb-4">Statistics</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Played" value={stats.gamesPlayed} />
        <Stat label="Win %" value={`${winRate}%`} />
        <Stat label="Current Streak" value={stats.currentStreak} />
        <Stat label="Max Streak" value={stats.maxStreak} />
      </div>

      <h3 className="text-lg font-medium mb-2">Guess Distribution</h3>
      <div className="space-y-2">
        {Object.entries(stats.guessDistribution).map(([guesses, count]) => (
          <GuessBar 
            key={guesses}
            guesses={parseInt(guesses)}
            count={count}
            maxCount={Math.max(...Object.values(stats.guessDistribution))}
          />
        ))}
      </div>
    </div>
  );
}
