// src/app/api/search/route.ts
import { neon } from '@neondatabase/serverless';  // Add this import
import { NextResponse } from 'next/server';
import { Pokemon } from '@/types/pokemon';

// Initialize neon outside the handler for better performance
const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.toLowerCase();

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const pokemon = await sql`
      SELECT 
        p.*,
        array_agg(DISTINCT pt.type_name) as types,
        array_agg(DISTINCT pa.ability_name) as abilities,
        array_agg(DISTINCT peg.egg_group_name) as egg_groups
      FROM pokemon p
      LEFT JOIN pokemon_types pt ON p.id = pt.pokemon_id
      LEFT JOIN pokemon_abilities pa ON p.id = pa.pokemon_id
      LEFT JOIN pokemon_egg_groups peg ON p.id = peg.pokemon_id
      WHERE p.name ILIKE ${`%${query}%`}
      GROUP BY p.id
      LIMIT 10
    `;

    return NextResponse.json(pokemon);
  } catch (error) {
    console.error('Error searching pokemon:', error);
    return NextResponse.json({ error: 'Failed to search pokemon' }, { status: 500 });
  }
}