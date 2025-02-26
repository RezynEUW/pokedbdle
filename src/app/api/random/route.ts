import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';
import { getIdRangesForGenerations } from '@/lib/utils/generations';

// Initialize neon outside the handler for better performance
const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: Request) {
  
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const excludeIds = searchParams.get('exclude')?.split(',') || [];
    const generations = searchParams.get('generations')?.split(',').map(Number) || 
      Array.from({ length: 9 }, (_, i) => i + 1);
    
    // Get ID ranges for the selected generations
    const genRanges = getIdRangesForGenerations(generations);
    
    // Build the ID range condition for the query
    const idRangeConditions = genRanges
      .map(range => `(p.id BETWEEN ${range.start} AND ${range.end})`)
      .join(' OR ');
    
    let query = `
      SELECT 
        p.*,
        array_agg(DISTINCT pt.type_name) as types,
        array_agg(DISTINCT pa.ability_name) as abilities,
        array_agg(DISTINCT peg.egg_group_name) as egg_groups
      FROM pokemon p
      LEFT JOIN pokemon_types pt ON p.id = pt.pokemon_id
      LEFT JOIN pokemon_abilities pa ON p.id = pa.pokemon_id
      LEFT JOIN pokemon_egg_groups peg ON p.id = peg.pokemon_id
      WHERE (${idRangeConditions})
    `;
    
    // Add exclusion condition if needed
    if (excludeIds.length > 0) {
      // Make sure they are all valid numbers
      const validIds = excludeIds
        .map(id => parseInt(id))
        .filter(id => !isNaN(id));
      
      if (validIds.length > 0) {
        query += ` AND p.id NOT IN (${validIds.join(',')})`;
      }
    }
    
    query += `
      GROUP BY p.id
      ORDER BY RANDOM()
      LIMIT 1
    `;

    const pokemon = await sql(query);

    if (!pokemon || pokemon.length === 0) {
      return NextResponse.json(
        { error: 'No Pokémon found for the selected generations' },
        { status: 404 }
      );
    }

    return NextResponse.json(pokemon[0]);
  } catch (error) {
    console.error('Error fetching random Pokémon:', error);
    return NextResponse.json(
      { error: 'Failed to fetch random Pokémon' },
      { status: 500 }
    );
  }
}