import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getIdRangesForGenerations } from '@/lib/utils/generations';

export async function GET(request: NextRequest) {
  try {
    // Get the client's local hour and generations
    const { searchParams } = new URL(request.url);
    const clientHour = parseInt(searchParams.get('hour') || '12');
    const generations = searchParams.get('generations')?.split(',').map(Number) || 
      Array.from({ length: 9 }, (_, i) => i + 1);
    
    // Get ID ranges for the selected generations
    const genRanges = getIdRangesForGenerations(generations);
    
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

    // Build the ID range condition for the SQL query
    const idRangeConditions = genRanges
      .map(range => `(p.id BETWEEN ${range.start} AND ${range.end})`)
      .join(' OR ');
    
    // Fetch today's Pokemon
    let dailyPokemon;
    
    // Check if we have a daily Pokemon already
    const existingDailyPokemon = await sql`
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
      AND (${idRangeConditions})
      GROUP BY p.id, hs.highest_stats
    `;

    // If we don't have a valid Pokemon for today within the selected generations
    if (existingDailyPokemon.length === 0) {
      // Check if there's any entry for today
      const anyExistingEntry = await sql`
        SELECT pokemon_id FROM daily_pokemon WHERE date = ${today}
      `;
      
      // If there's no entry at all for today, insert one within the selected generations
      if (anyExistingEntry.length === 0) {
        // Build a query to select a random Pokemon within the ranges
        const insertQuery = `
          INSERT INTO daily_pokemon (date, pokemon_id)
          SELECT '${today}', id 
          FROM pokemon p
          WHERE ${idRangeConditions}
          ORDER BY RANDOM()
          LIMIT 1
        `;
        
        await sql(insertQuery);
      }
      
      // Fetch the daily Pokemon again (should now be set)
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
    } else {
      dailyPokemon = existingDailyPokemon;
    }

    // Fetch yesterday's Pokemon
    const yesterdayPokemon = await sql`
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

    return NextResponse.json({ 
      pokemon: dailyPokemon[0],
      yesterdayPokemon: yesterdayPokemon[0]
    });
  } catch (error) {
    console.error('Error getting daily pokemon:', error);
    return NextResponse.json({ error: 'Failed to get daily pokemon' }, { status: 500 });
  }
}