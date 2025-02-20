// src/app/api/daily/complete/route.ts
import { neon } from '@neondatabase/serverless';
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
    
    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      UPDATE daily_pokemon
      SET is_completed = ${completed}, won = ${won}
      WHERE date = ${dateToUse}
    `;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating completion status:', error);
    return NextResponse.json({ error: 'Failed to update completion status' }, { status: 500 });
  }
}