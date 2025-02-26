import { queryWithRetry } from '@/lib/db';
import { createNoCacheResponse, createErrorResponse } from '@/lib/cache-utils';
import { getIdRangesForGenerations } from '@/lib/utils/generations';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.toLowerCase();
  const generations = searchParams.get('generations')?.split(',').map(Number) || 
    Array.from({ length: 9 }, (_, i) => i + 1);
  
  // Cache busting timestamp (ignored in logic, but used in the client)
  // const timestamp = searchParams.get('t');

  if (!query) {
    return createErrorResponse('Query parameter is required', 400);
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

    // Use queryWithRetry with parameterized query
    const pokemon = await queryWithRetry(
      searchQuery, 
      [`%${query}%`],
      { retries: 3 }
    );

    return createNoCacheResponse(pokemon || []);
  } catch (error) {
    console.error('Error searching pokemon:', error);
    return createErrorResponse('Failed to search pokemon', 500);
  }
}