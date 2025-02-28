import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getDailyPokemon } from '@/lib/game/dailyPokemon';
import { isPokemonInGenerations, getIdRangesForGenerations } from '@/lib/utils/generations';
import { dbConnectionManager } from '@/lib/db/connectionManager';

export async function GET(request: NextRequest) {
  try {
    // Get the client's local date and generations
    const { searchParams } = new URL(request.url);
    const clientDate = searchParams.get('date'); // Client's local date in YYYY-MM-DD format
    const generations = searchParams.get('generations')?.split(',').map(Number) || 
      Array.from({ length: 9 }, (_, i) => i + 1);
    
    if (!clientDate) {
      return NextResponse.json({ error: 'Client date is required' }, { status: 400 });
    }
    
    // Use the client's date directly (not yesterday's date)
    const clientDateObj = new Date(clientDate);
    const todayDate = clientDateObj.toISOString().split('T')[0];
    
    // Calculate tomorrow's date (the day after client's date)
    const tomorrowDateObj = new Date(clientDateObj);
    tomorrowDateObj.setDate(tomorrowDateObj.getDate() + 1);
    const tomorrowDate = tomorrowDateObj.toISOString().split('T')[0];
    
    // Yesterday's Pokémon = day before client's date
    const yesterdayDateObj = new Date(clientDateObj);
    yesterdayDateObj.setDate(yesterdayDateObj.getDate() - 1);
    const yesterdayDate = yesterdayDateObj.toISOString().split('T')[0];
    
    console.log('Client date:', clientDate);
    console.log('Using today date:', todayDate);
    console.log('Using tomorrow date:', tomorrowDate);
    console.log('Using yesterday date:', yesterdayDate);
    
    // Always check if tomorrow's Pokémon exists, and create it if not
    const [tomorrowEntry] = await dbConnectionManager.query(
      'SELECT pokemon_id FROM daily_pokemon WHERE date = $1',
      [tomorrowDate]
    );
    
    if (!tomorrowEntry) {
      console.log(`Creating Pokémon for tomorrow (${tomorrowDate})`);
      // Generate a Pokémon for tomorrow using all generations
      await generatePokemonForDate(tomorrowDate);
    } else {
      console.log(`Tomorrow's Pokémon already exists with ID:`, tomorrowEntry.pokemon_id);
    }
    
    // Check if we have a Pokémon for today's date
    const [todayEntry] = await dbConnectionManager.query(
      'SELECT pokemon_id FROM daily_pokemon WHERE date = $1',
      [todayDate]
    );
    
    // Get the full Pokémon data if available
    let todayPokemon;
    let isGlobalDaily = true;
    
    if (todayEntry) {
      console.log('Found today entry with ID:', todayEntry.pokemon_id);
      
      // If we have a matching entry that's in the selected generations, use it
      const targetPokemon = await getPokemonById(todayEntry.pokemon_id);
      const isInSelectedGens = isPokemonInGenerations(targetPokemon.id, generations);
      
      if (isInSelectedGens) {
        todayPokemon = targetPokemon;
      } else {
        // If not in selected generations, generate a generation-specific one
        todayPokemon = await getDailyPokemon({ generations });
        isGlobalDaily = false;
      }
    } else {
      console.log('No entry found for today, generating one');
      // Create today's global Pokémon
      const todayPokemonId = await generatePokemonForDate(todayDate);
      if (todayPokemonId) {
        const newPokemon = await getPokemonById(todayPokemonId);
        const isInSelectedGens = isPokemonInGenerations(newPokemon.id, generations);
        
        if (isInSelectedGens) {
          todayPokemon = newPokemon;
        } else {
          // If the generated Pokémon is not in selected generations, use a generation-specific one
          todayPokemon = await getDailyPokemon({ generations });
          isGlobalDaily = false;
        }
      } else {
        // Fallback: use getDailyPokemon if direct generation failed
        todayPokemon = await getDailyPokemon({ generations });
      }
    }
    
    // Fetch yesterday's Pokémon
    const [yesterdayEntry] = await dbConnectionManager.query(
      'SELECT pokemon_id FROM daily_pokemon WHERE date = $1',
      [yesterdayDate]
    );
    
    let yesterdayPokemon = null;
    
    if (yesterdayEntry) {
      console.log('Found yesterday entry with ID:', yesterdayEntry.pokemon_id);
      // Fetch the complete Pokémon data
      yesterdayPokemon = await getPokemonById(yesterdayEntry.pokemon_id);
    } else {
      console.log('No entry found for yesterday');
    }

    return NextResponse.json({ 
      pokemon: todayPokemon,
      yesterdayPokemon,
      isGlobalDaily
    });
  } catch (error) {
    console.error('Error getting daily pokemon:', error);
    return NextResponse.json({ error: 'Failed to get daily pokemon' }, { status: 500 });
  }
}

// Helper function to generate a Pokémon for a specific date
async function generatePokemonForDate(dateStr: string): Promise<number | null> {
  console.log(`Generating Pokémon for date: ${dateStr}`);
  
  try {
    // Use all generations for global daily
    const allGenerations = Array.from({ length: 9 }, (_, i) => i + 1);
    const genRanges = getIdRangesForGenerations(allGenerations);
    
    // Build ID range condition
    const idRangeCondition = genRanges
      .map(range => `(id BETWEEN ${range.start} AND ${range.end})`)
      .join(' OR ');
      
    // Insert a random Pokémon for the specified date
    const insertQuery = `
      INSERT INTO daily_pokemon (date, pokemon_id)
      SELECT $1, id 
      FROM pokemon 
      WHERE ${idRangeCondition}
      ORDER BY RANDOM() 
      LIMIT 1
      RETURNING pokemon_id
    `;
    
    const [result] = await dbConnectionManager.query(insertQuery, [dateStr]);
    
    if (result && result.pokemon_id) {
      console.log(`Successfully generated Pokémon for ${dateStr}: ID ${result.pokemon_id}`);
      return result.pokemon_id;
    }
    
    console.log(`Failed to generate Pokémon for ${dateStr}`);
    return null;
  } catch (error) {
    console.error(`Error generating Pokémon for ${dateStr}:`, error);
    return null;
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