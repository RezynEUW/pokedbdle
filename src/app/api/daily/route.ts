import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getDailyPokemon } from '@/lib/game/dailyPokemon';
import { isPokemonInGenerations } from '@/lib/utils/generations';
import { dbConnectionManager } from '@/lib/db/connectionManager';

export async function GET(request: NextRequest) {
  try {
    // Get the client's local date and generations
    const { searchParams } = new URL(request.url);
    const clientDate = searchParams.get('date'); // Client's local date in YYYY-MM-DD format
    const generations = searchParams.get('generations')?.split(',').map(Number) || 
      Array.from({ length: 9 }, (_, i) => i + 1);
    
    console.log('API daily route - Requested generations:', generations);
    
    if (!clientDate) {
      return NextResponse.json({ error: 'Client date is required' }, { status: 400 });
    }
    
    // Use the client's date directly for today's entry
    const clientDateObj = new Date(clientDate);
    const todayDate = clientDateObj.toISOString().split('T')[0];
    
    // Yesterday's Pokémon = day before client's date
    const yesterdayDateObj = new Date(clientDateObj);
    yesterdayDateObj.setDate(yesterdayDateObj.getDate() - 1);
    const yesterdayDate = yesterdayDateObj.toISOString().split('T')[0];
    
    console.log('Using today date:', todayDate);
    console.log('Using yesterday date:', yesterdayDate);
    
    // First check if we have a Pokémon for today's date
    const [todayEntry] = await dbConnectionManager.query(
      'SELECT pokemon_id FROM daily_pokemon WHERE date = $1',
      [todayDate]
    );
    
    // Get the full Pokémon data if available
    let todayPokemon;
    let isGlobalDaily = true;
    
    if (todayEntry) {
      // Get the target Pokémon
      const targetPokemon = await getPokemonById(todayEntry.pokemon_id);
      
      // Check if it's in the selected generations
      const isInSelectedGens = isPokemonInGenerations(targetPokemon.id, generations);
      console.log(`Daily pokemon ID: ${targetPokemon.id}, is in selected generations: ${isInSelectedGens}`);
      
      if (isInSelectedGens) {
        // Only use global daily if it's actually in the selected generations
        todayPokemon = targetPokemon;
        console.log(`Using global daily Pokémon: ${targetPokemon.name} (ID: ${targetPokemon.id})`);
      } else {
        // Otherwise, ALWAYS generate a generation-specific Pokémon
        // This ensures generation filtering ALWAYS takes priority
        console.log('Global daily not in selected generations, generating generation-specific Pokémon');
        todayPokemon = await getDailyPokemon({ generations });
        isGlobalDaily = false;
        console.log(`Generated Pokémon: ${todayPokemon.name} (ID: ${todayPokemon.id})`);
      }
    } else {
      // No entry for today, create one
      console.log('No entry for today, generating Pokémon');
      todayPokemon = await getDailyPokemon({ generations });
      console.log(`Generated fallback Pokémon: ${todayPokemon.name} (ID: ${todayPokemon.id})`);
    }
    
    // Verify the generated Pokémon is actually in the selected generations
    const finalIsInSelectedGens = isPokemonInGenerations(todayPokemon.id, generations);
    if (!finalIsInSelectedGens) {
      console.error(`ERROR: Generated Pokémon (ID: ${todayPokemon.id}) not in selected generations: ${generations}`);
      // Force a retry with stricter filtering if needed
      todayPokemon = await getDailyPokemon({ generations });
      isGlobalDaily = false;
      console.log(`Retry generated Pokémon: ${todayPokemon.name} (ID: ${todayPokemon.id})`);
    }
    
    // Fetch yesterday's Pokémon
    const [yesterdayEntry] = await dbConnectionManager.query(
      'SELECT pokemon_id FROM daily_pokemon WHERE date = $1',
      [yesterdayDate]
    );
    
    let yesterdayPokemon = null;
    
    if (yesterdayEntry) {
      // Fetch the complete Pokémon data
      yesterdayPokemon = await getPokemonById(yesterdayEntry.pokemon_id);
    }

    // Add cache control headers to prevent caching
    return NextResponse.json({ 
      pokemon: todayPokemon,
      yesterdayPokemon,
      isGlobalDaily
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error getting daily pokemon:', error);
    return NextResponse.json({ error: 'Failed to get daily pokemon' }, { status: 500 });
  }
}

// Helper function to get a Pokémon by ID
async function getPokemonById(id: number) {
  const query = `
    WITH highest_stats AS (
      SELECT 
        pokemon_id,
        array_agg(stat_name ORDER BY stat_name) as highest_stats,
        MAX(base_value) as highest_stat_value
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
      COALESCE(hs.highest_stats, ARRAY[]::text[]) as highest_stats,
      COALESCE(hs.highest_stat_value, 0) as highest_stat_value
    FROM pokemon p
    LEFT JOIN pokemon_types pt ON p.id = pt.pokemon_id
    LEFT JOIN pokemon_abilities pa ON p.id = pa.pokemon_id
    LEFT JOIN pokemon_egg_groups peg ON p.id = peg.pokemon_id
    LEFT JOIN highest_stats hs ON p.id = hs.pokemon_id
    WHERE p.id = $1
    GROUP BY p.id, hs.highest_stats, hs.highest_stat_value
  `;
  
  const [pokemon] = await dbConnectionManager.query(query, [id]);
  
  return {
    id: pokemon.id,
    name: pokemon.name,
    generation: pokemon.generation,
    types: pokemon.types || [],
    color: pokemon.color,
    evolution_stage: pokemon.evolution_stage,
    height: pokemon.height,
    weight: pokemon.weight,
    base_stat_total: pokemon.base_stat_total,
    highest_stats: pokemon.highest_stats || [],
    highest_stat_value: pokemon.highest_stat_value || 0,
    abilities: pokemon.abilities || [],
    egg_groups: pokemon.egg_groups || [],
    habitat: '',
    sprite_default: pokemon.sprite_default,
    sprite_official: pokemon.sprite_official,
    sprite_shiny: pokemon.sprite_shiny
  };
}