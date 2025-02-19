// components/TimeBasedBackground.tsx
'use client';

import { useEffect, useState } from 'react';

// Map time periods to image paths
const backgroundMap = {
  'early-morning': '/art/01-Early-Morning.png',
  'mid-morning': '/art/02-Mid-Morning.png',
  'late-morning': '/art/03-Late-Morning.png',
  'early-afternoon': '/art/04-Early-Afternoon.png',
  'mid-afternoon': '/art/05-Mid-Afternoon.png',
  'late-afternoon': '/art/06-Late-Afternoon.png',
  'early-evening': '/art/07-Early-Evening.png',
  'mid-evening': '/art/08-Mid-Evening.png',
  'late-evening': '/art/09-Late-Evening.png',
  'early-night': '/art/10-Early-Night.png',
  'mid-night': '/art/11-Mid-Night.png',
  'late-night': '/art/12-Late-Night.png',
};

type TimePeriod = keyof typeof backgroundMap;

const getTimePeriod = (hour: number): TimePeriod => {
  if (hour >= 5 && hour < 7) return 'early-morning';
  if (hour >= 7 && hour < 9) return 'mid-morning';
  if (hour >= 9 && hour < 11) return 'late-morning';
  if (hour >= 11 && hour < 13) return 'early-afternoon';
  if (hour >= 13 && hour < 15) return 'mid-afternoon';
  if (hour >= 15 && hour < 17) return 'late-afternoon';
  if (hour >= 17 && hour < 19) return 'early-evening';
  if (hour >= 19 && hour < 21) return 'mid-evening';
  if (hour >= 21 && hour < 23) return 'late-evening';
  if (hour >= 23 || hour < 1) return 'early-night';
  if (hour >= 1 && hour < 3) return 'mid-night';
  return 'late-night'; // 3-5 AM
};

export default function TimeBasedBackground({ children }: { children: React.ReactNode }) {
  const [backgroundPath, setBackgroundPath] = useState<string>('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Get current hour in user's local time
    const currentHour = new Date().getHours();
    const timePeriod = getTimePeriod(currentHour);
    setBackgroundPath(backgroundMap[timePeriod]);
    setLoaded(true);

    // Update background every hour
    const interval = setInterval(() => {
      const newHour = new Date().getHours();
      const newTimePeriod = getTimePeriod(newHour);
      setBackgroundPath(backgroundMap[newTimePeriod]);
    }, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      style={{
        backgroundImage: loaded ? `url(${backgroundPath})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        width: '100%',
        transition: 'background-image 1s ease-in-out',
      }}
    >
      {children}
    </div>
  );
}