import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { dbConnectionManager } from '@/lib/db/connectionManager';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date'); // Get client date instead of hour
    
    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
    }
    
    // Parse the date from the client
    const clientDateObj = new Date(date);
    
    // Yesterday's date is the actual date in the database for "today's" Pokémon
    const todayDateObj = new Date(clientDateObj);
    todayDateObj.setDate(todayDateObj.getDate() - 1);
    const dateToUse = todayDateObj.toISOString().split('T')[0];
    
    const { completed, won } = await request.json();
    
    await dbConnectionManager.query(
      'UPDATE daily_pokemon SET is_completed = $1, won = $2 WHERE date = $3',
      [completed, won, dateToUse]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating completion status:', error);
    return NextResponse.json({ error: 'Failed to update completion status' }, { status: 500 });
  }
}