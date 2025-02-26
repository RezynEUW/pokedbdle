import { getSql, queryWithRetry } from '@/lib/db';
import { NO_CACHE_HEADERS, createErrorResponse, createNoCacheResponse } from '@/lib/cache-utils';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientHour = parseInt(searchParams.get('hour') || '12');
    
    const now = new Date();
    let dateToUse: string;
    
    if (clientHour >= 0 && clientHour < 24) {
      dateToUse = now.toISOString().split('T')[0];
    } else {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      dateToUse = yesterday.toISOString().split('T')[0];
    }
    
    const { completed, won } = await request.json();
    
    // Use the queryWithRetry function instead of direct neon call
    await queryWithRetry(`
      UPDATE daily_pokemon
      SET is_completed = $1, won = $2
      WHERE date = $3
    `, [completed, won, dateToUse], { retries: 3 });
    
    return createNoCacheResponse({ success: true });
  } catch (error) {
    console.error('Error updating completion status:', error);
    return createErrorResponse('Failed to update completion status', 500);
  }
}