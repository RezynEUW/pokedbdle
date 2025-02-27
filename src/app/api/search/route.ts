import { NextResponse } from 'next/server';
import { getIdRangesForGenerations } from '@/lib/utils/generations';
import { executeQuery } from '@/lib/db/connectionManager';

export async function GET(request: Request) {
  // Set cache control headers to prevent caching
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, max-age=0, must-revalidate',
    'Pragma': 'no-cache'
  };

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.toLowerCase();
  const generations = searchParams.get('generations')?.split(',').map(Number) || 
    Array.from({ length: 9 }, (_, i) => i + 1);

  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter is required' }, 
      { status: 400, headers }
    );
  }

  try {
    // Get ID ranges for the selected generations
    const genRanges = getIdRangesForGenerations(generations);
    
    // Build the ID range condition for the query
    const idRangeConditions = genRanges
      .map(range => `(p.id BETWEEN ${range.start} AND ${range.end})`)
      .join(' OR ');
    
    // Use parameterized query to prevent SQL injection
    const searchQuery = `
      SELECT 
        p.*,
        array_agg(DISTINCT pt.type_name) as types,
        array_agg(DISTINCT pa.ability_name) as abilities,
        array_agg(DISTINCT peg.egg_group_name) as egg_groups
      FROM pokemon p
      LEFT JOIN pokemon_types pt ON p.id = pt.pokemon_id
      LEFT JOIN pokemon_abilities pa ON p.id = pa.pokemon_id
      LEFT JOIN pokemon_egg_groups peg ON p.id = peg.pokemon_id
      WHERE p.name ILIKE $1
      AND (${idRangeConditions})
      GROUP BY p.id
      LIMIT 10
    `;

    // Use our connection manager instead of direct neon connection
    const pokemon = await executeQuery(searchQuery, [`%${query}%`]);

    return NextResponse.json(pokemon, { headers });
  } catch (error) {
    console.error('Error searching pokemon:', error);
    return NextResponse.json(
      { error: 'Failed to search pokemon' }, 
      { status: 500, headers }
    );
  }
}