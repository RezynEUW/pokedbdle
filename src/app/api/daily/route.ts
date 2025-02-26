import { getSql, queryWithRetry } from '@/lib/db';
import { createNoCacheResponse, createErrorResponse } from '@/lib/cache-utils';
import { NextRequest } from 'next/server';
import { getDailyPokemon } from '@/lib/game/dailyPokemon';

export async function GET(request: NextRequest) {
  try {
    // Get the client's local hour and generations
    const { searchParams } = new URL(request.url);
    const clientHour = parseInt(searchParams.get('hour') || '12');
    const generations = searchParams.get('generations')?.split(',').map(Number) || 
      Array.from({ length: 9 }, (_, i) => i + 1);
    
    // Determine dates to use
    const now = new Date();
    
    // Adjust date based on client's local hour
    const today = clientHour < 5 
      ? new Date(now.setDate(now.getDate() - 1)).toISOString().split('T')[0]
      : now.toISOString().split('T')[0];
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];

    // Get today's Pokémon using the enhanced getDailyPokemon function
    const todayPokemon = await getDailyPokemon({ generations });
    
    // Check if the Pokémon we got is the global daily
    const globalDaily = await queryWithRetry(`
      SELECT pokemon_id FROM daily_pokemon WHERE date = $1
    `, [today]);
    
    const isGlobalDaily = globalDaily && 
                        globalDaily.length > 0 && 
                        globalDaily[0].pokemon_id === todayPokemon.id;
    
    // Fetch yesterday's Pokémon 
    // (no need to filter by generation for yesterday's Pokémon)
    const yesterdayEntry = await queryWithRetry(`
      SELECT pokemon_id FROM daily_pokemon WHERE date = $1
    `, [yesterdayDate]);
    
    let yesterdayPokemon = null;
    
    if (yesterdayEntry && yesterdayEntry.length > 0) {
      // Fetch the complete Pokémon data
      const query = `
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
        FROM pokemon p
        LEFT JOIN pokemon_types pt ON p.id = pt.pokemon_id
        LEFT JOIN pokemon_abilities pa ON p.id = pa.pokemon_id
        LEFT JOIN pokemon_egg_groups peg ON p.id = peg.pokemon_id
        LEFT JOIN highest_stats hs ON p.id = hs.pokemon_id
        WHERE p.id = $1
        GROUP BY p.id, hs.highest_stats
      `;
      
      const pokemon = await queryWithRetry(query, [yesterdayEntry[0].pokemon_id]);
      if (pokemon && pokemon.length > 0) {
        yesterdayPokemon = pokemon[0];
      }
    }

    return createNoCacheResponse({ 
      pokemon: todayPokemon,
      yesterdayPokemon,
      isGlobalDaily
    });
  } catch (error) {
    console.error('Error getting daily pokemon:', error);
    return createErrorResponse('Failed to get daily pokemon', 500);
  }
}