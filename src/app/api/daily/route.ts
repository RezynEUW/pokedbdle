import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the client's local hour to determine which date to use
    const { searchParams } = new URL(request.url);
    const clientHour = parseInt(searchParams.get('hour') || '12');
    
    const sql = neon(process.env.DATABASE_URL!);
    
    // Determine dates to use
    const now = new Date();
    
    // Adjust date based on client's local hour
    const today = clientHour < 5 
      ? new Date(now.setDate(now.getDate() + 1)).toISOString().split('T')[0]
      : now.toISOString().split('T')[0];
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];

    // Fetch today's Pokemon
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
      WHERE dp.date = ${today}
      GROUP BY p.id, hs.highest_stats
    `;

    // If no Pokemon for today, insert a random one
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
        WHERE dp.date = ${today}
        GROUP BY p.id, hs.highest_stats
      `;
    }

    // Fetch yesterday's Pokemon
    let yesterdayPokemon = await sql`
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
      WHERE dp.date = ${yesterdayDate}
      GROUP BY p.id, hs.highest_stats
    `;

    // If no Pokemon for yesterday, insert a random one
    if (!yesterdayPokemon.length) {
      await sql`
        INSERT INTO daily_pokemon (date, pokemon_id)
        SELECT ${yesterdayDate}, id FROM pokemon
        ORDER BY RANDOM()
        LIMIT 1
      `;
      
      yesterdayPokemon = await sql`
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
        WHERE dp.date = ${yesterdayDate}
        GROUP BY p.id, hs.highest_stats
      `;
    }

    return NextResponse.json({ 
      pokemon: dailyPokemon[0],
      yesterdayPokemon: yesterdayPokemon[0]
    });
  } catch (error) {
    console.error('Error getting daily pokemon:', error);
    return NextResponse.json({ error: 'Failed to get daily pokemon' }, { status: 500 });
  }
}