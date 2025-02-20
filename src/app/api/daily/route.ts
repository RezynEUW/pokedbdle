import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the client's local hour to determine which date to use
    const { searchParams } = new URL(request.url);
    const clientHour = parseInt(searchParams.get('hour') || '12');
    
    const sql = neon(process.env.DATABASE_URL!);
    
    // Determine which date to use based on client's hour
    const now = new Date();
    let dateToUse: string;
    
    if (clientHour >= 0 && clientHour < 24) {
      // If it's a valid hour, use the server's current date
      dateToUse = now.toISOString().split('T')[0];
    } else {
      // If client sends a negative hour, it means they need yesterday's Pokémon
      // (This is a signal that they haven't passed midnight locally yet)
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      dateToUse = yesterday.toISOString().split('T')[0];
    }
    
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
        p.sprite_shiny,
        array_agg(DISTINCT pt.type_name) as types,
        array_agg(DISTINCT pa.ability_name) as abilities,
        array_agg(DISTINCT peg.egg_group_name) as egg_groups,
        COALESCE(hs.highest_stats, ARRAY[]::text[]) as highest_stats
      FROM daily_pokemon dp
      JOIN pokemon p ON dp.pokemon_id = p.id
      LEFT JOIN pokemon_types pt ON p.id = pt.pokemon_id
      LEFT JOIN pokemon_abilities pa ON p.id = pa.pokemon_id
      LEFT JOIN pokemon_egg_groups peg ON p.id = peg.pokemon_id
      LEFT JOIN highest_stats hs ON p.id = hs.pokemon_id
      WHERE dp.date = ${dateToUse}
      GROUP BY p.id, hs.highest_stats
    `;

    if (!dailyPokemon.length) {
      await sql`
        INSERT INTO daily_pokemon (date, pokemon_id)
        SELECT ${dateToUse}, id FROM pokemon
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
          p.sprite_shiny,
          array_agg(DISTINCT pt.type_name) as types,
          array_agg(DISTINCT pa.ability_name) as abilities,
          array_agg(DISTINCT peg.egg_group_name) as egg_groups,
          COALESCE(hs.highest_stats, ARRAY[]::text[]) as highest_stats
        FROM daily_pokemon dp
        JOIN pokemon p ON dp.pokemon_id = p.id
        LEFT JOIN pokemon_types pt ON p.id = pt.pokemon_id
        LEFT JOIN pokemon_abilities pa ON p.id = pa.pokemon_id
        LEFT JOIN pokemon_egg_groups peg ON p.id = peg.pokemon_id
        LEFT JOIN highest_stats hs ON p.id = hs.pokemon_id
        WHERE dp.date = ${dateToUse}
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