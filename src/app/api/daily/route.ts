// src/app/api/daily/route.ts
import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const today = new Date().toISOString().split('T')[0];
    
    let dailyPokemon = await sql`
      WITH highest_stats AS (
        SELECT 
          pokemon_id,
          array_agg(stat_name ORDER BY stat_name) as highest_stats
        FROM pokemon_stats 
        WHERE is_highest = true
        GROUP BY pokemon_id
      )
      SELECT 
        p.id, 
        p.name, 
        p.generation,
        p.color,
        p.evolution_stage,
        p.height,
        p.weight,
        p.base_stat_total,
        p.sprite_official,
        p.sprite_default,
        array_agg(DISTINCT pt.type_name) as types,
        array_agg(DISTINCT pa.ability_name) as abilities,
        COALESCE(hs.highest_stats, ARRAY[]::text[]) as highest_stats
      FROM daily_pokemon dp
      JOIN pokemon p ON dp.pokemon_id = p.id
      LEFT JOIN pokemon_types pt ON p.id = pt.pokemon_id
      LEFT JOIN pokemon_abilities pa ON p.id = pa.pokemon_id
      LEFT JOIN highest_stats hs ON p.id = hs.pokemon_id
      WHERE dp.date = ${today}
      GROUP BY p.id, hs.highest_stats
    `;

    if (!dailyPokemon.length) {
      await sql`
        INSERT INTO daily_pokemon (date, pokemon_id)
        SELECT ${today}, id FROM pokemon
        ORDER BY RANDOM()
        LIMIT 1
      `;
      
      dailyPokemon = await sql`
        WITH highest_stats AS (
          SELECT 
            pokemon_id,
            array_agg(stat_name ORDER BY stat_name) as highest_stats
          FROM pokemon_stats 
          WHERE is_highest = true
          GROUP BY pokemon_id
        )
        SELECT 
          p.id, 
          p.name, 
          p.generation,
          p.color,
          p.evolution_stage,
          p.height,
          p.weight,
          p.base_stat_total,
          p.sprite_official,
          p.sprite_default,
          array_agg(DISTINCT pt.type_name) as types,
          array_agg(DISTINCT pa.ability_name) as abilities,
          COALESCE(hs.highest_stats, ARRAY[]::text[]) as highest_stats
        FROM daily_pokemon dp
        JOIN pokemon p ON dp.pokemon_id = p.id
        LEFT JOIN pokemon_types pt ON p.id = pt.pokemon_id
        LEFT JOIN pokemon_abilities pa ON p.id = pa.pokemon_id
        LEFT JOIN highest_stats hs ON p.id = hs.pokemon_id
        WHERE dp.date = ${today}
        GROUP BY p.id, hs.highest_stats
      `;
    }

    console.log('Daily Pokemon data:', dailyPokemon[0]); // Debug log

    return NextResponse.json({ pokemon: dailyPokemon[0] });
  } catch (error) {
    console.error('Error getting daily pokemon:', error);
    return NextResponse.json({ error: 'Failed to get daily pokemon' }, { status: 500 });
  }
}