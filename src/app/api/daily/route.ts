import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const today = new Date().toISOString().split('T')[0];
    
    let dailyPokemon = await sql`
      SELECT 
        p.id, 
        p.name, 
        p.generation,
        p.color,
        p.evolution_stage,
        p.height,
        p.weight,
        p.sprite_official,
        array_agg(DISTINCT pt.type_name) as types
      FROM daily_pokemon dp
      JOIN pokemon p ON dp.pokemon_id = p.id
      LEFT JOIN pokemon_types pt ON p.id = pt.pokemon_id
      WHERE dp.date = ${today}
      GROUP BY p.id
    `;

    if (!dailyPokemon.length) {
      await sql`
        INSERT INTO daily_pokemon (date, pokemon_id)
        SELECT ${today}, id FROM pokemon
        ORDER BY RANDOM()
        LIMIT 1
      `;
      dailyPokemon = await sql`
        SELECT 
          p.id, 
          p.name, 
          p.generation,
          p.color,
          p.evolution_stage,
          p.height,
          p.weight,
          p.sprite_official,
          array_agg(DISTINCT pt.type_name) as types
        FROM daily_pokemon dp
        JOIN pokemon p ON dp.pokemon_id = p.id
        LEFT JOIN pokemon_types pt ON p.id = pt.pokemon_id
        WHERE dp.date = ${today}
        GROUP BY p.id
      `;
    }

    return NextResponse.json({ pokemon: dailyPokemon[0] });
  } catch (error) {
    console.error('Error getting daily pokemon:', error);
    return NextResponse.json({ error: 'Failed to get daily pokemon' }, { status: 500 });
  }
}
