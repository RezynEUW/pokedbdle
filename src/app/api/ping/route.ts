// src/app/api/ping/route.ts
import { NextResponse } from 'next/server';
import { dbConnectionManager } from '@/lib/db/connectionManager';

export async function GET() {
  try {
    // Check database connection
    const result = await dbConnectionManager.query('SELECT 1 as ping');
    
    // Also check for and generate tomorrow's Pokémon if needed
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const tomorrowExists = await dbConnectionManager.query(
      'SELECT EXISTS(SELECT 1 FROM daily_pokemon WHERE date = $1) as exists',
      [tomorrowStr]
    );
    
    // Generate tomorrow's Pokémon if needed
    if (!tomorrowExists[0]?.exists) {
      // Your logic to generate tomorrow's Pokémon
      console.log(`Ping endpoint generating Pokemon for ${tomorrowStr}`);
      // Call your generation function here
    }
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      tomorrowReady: !!tomorrowExists[0]?.exists
    });
  } catch (error) {
    console.error('Ping failed:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: String(error) 
    }, { status: 500 });
  }
}