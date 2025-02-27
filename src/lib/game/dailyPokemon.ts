import { Pokemon } from '@/types/pokemon';
import { getIdRangesForGenerations } from '@/lib/utils/generations';
import { dbConnectionManager } from '@/lib/db/connectionManager';

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

interface DailyPokemonOptions {
  generations?: number[];
}

export async function getDailyPokemon(options: DailyPokemonOptions = {}): Promise<Pokemon> {
  const today = new Date();
  const dateSeed = today.getFullYear() * 10000 + 
                   (today.getMonth() + 1) * 100 + 
                   today.getDate();

  try {
    // Get ID ranges for the selected generations
    const generations = options.generations || Array.from({ length: 9 }, (_, i) => i + 1);
    
    // Try to get the global daily Pokémon first
    const globalDailyPokemon = await getGlobalDailyPokemon();
    
    // Check if global daily exists and is in the selected generations
    if (globalDailyPokemon && isInGenerations(globalDailyPokemon.id, generations)) {
      return globalDailyPokemon;
    }
    
    // If global daily doesn't exist or isn't in selected generations, 
    // generate a generation-specific Pokémon
    const genRanges = getIdRangesForGenerations(generations);
    
    // Build the ID range condition
    const idRangeConditions = genRanges
      .map(range => `(id BETWEEN ${range.start} AND ${range.end})`)
      .join(' OR ');

    // Get count of Pokemon in selected generations
    const countQuery = `
      SELECT COUNT(*) as total_pokemon 
      FROM pokemon 
      WHERE ${idRangeConditions}
    `;
    
    const [countResult] = await dbConnectionManager.query(countQuery);
    const totalPokemon = parseInt(countResult.total_pokemon);
    
    if (totalPokemon === 0) {
      throw new Error('No Pokemon found in the selected generations');
    }
    
    // Use a combination of the date seed and a hash of the generations
    // to ensure different generations give different results on the same day
    const genHash = generations.reduce((acc, gen) => acc + gen, 0);
    const combinedSeed = dateSeed + genHash;
    
    // Get deterministic random index
    const randomIndex = Math.floor(seededRandom(combinedSeed) * totalPokemon);

    // Query for a Pokemon in the selected generations
    const pokemonQuery = `
      WITH ordered_pokemon AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY id) as row_num
        FROM pokemon
        WHERE ${idRangeConditions}
      ),
      max_stats AS (
        SELECT pokemon_id, MAX(base_value) as max_value
        FROM pokemon_stats
        GROUP BY pokemon_id
      ),
      highest_stats AS (
        SELECT 
          ps.pokemon_id,
          array_agg(ps.stat_name ORDER BY ps.stat_name) as highest_stats,
          MAX(ps.base_value) as highest_stat_value
        FROM pokemon_stats ps
        JOIN max_stats ms ON ps.pokemon_id = ms.pokemon_id 
        WHERE ps.base_value = ms.max_value
        GROUP BY ps.pokemon_id
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
        p.sprite_default,
        p.sprite_official,
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
      JOIN ordered_pokemon op ON p.id = op.id
      WHERE op.row_num = ${randomIndex + 1}
      GROUP BY 
        p.id, hs.highest_stats, hs.highest_stat_value
    `;

    const [dailyPokemon] = await dbConnectionManager.query(pokemonQuery);

    return {
      id: dailyPokemon.id,
      name: dailyPokemon.name,
      generation: dailyPokemon.generation,
      types: dailyPokemon.types || [],
      color: dailyPokemon.color,
      evolution_stage: dailyPokemon.evolution_stage,
      height: dailyPokemon.height,
      weight: dailyPokemon.weight,
      base_stat_total: dailyPokemon.base_stat_total,
      highest_stats: dailyPokemon.highest_stats || [],
      highest_stat_value: dailyPokemon.highest_stat_value || 0,
      abilities: dailyPokemon.abilities || [],
      egg_groups: dailyPokemon.egg_groups || [],
      habitat: '',
      sprite_default: dailyPokemon.sprite_default,
      sprite_official: dailyPokemon.sprite_official,
      sprite_shiny: dailyPokemon.sprite_shiny
    };
  } catch (error) {
    console.error('Error selecting daily Pokemon:', error);
    throw error;
  }
}

// Gets the global daily Pokémon from database, or creates it if it doesn't exist
async function getGlobalDailyPokemon(): Promise<Pokemon | null> {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    // Check if we already have a daily Pokémon
    const [existingDaily] = await dbConnectionManager.query(
      'SELECT pokemon_id FROM daily_pokemon WHERE date = $1',
      [today]
    );
    
    if (existingDaily) {
      // Get the full Pokémon data
      return getPokemonById(existingDaily.pokemon_id);
    } else {
      // No daily Pokémon yet, create a random one for today
      // Use all generations for global daily
      const allGenerations = Array.from({ length: 9 }, (_, i) => i + 1);
      const genRanges = getIdRangesForGenerations(allGenerations);
      
      // Build ID range condition
      const idRangeCondition = genRanges
        .map(range => `(id BETWEEN ${range.start} AND ${range.end})`)
        .join(' OR ');
        
      // Insert a random Pokémon for today
      const insertQuery = `
        INSERT INTO daily_pokemon (date, pokemon_id)
        SELECT $1, id 
        FROM pokemon 
        WHERE ${idRangeCondition}
        ORDER BY RANDOM() 
        LIMIT 1
        RETURNING pokemon_id
      `;
      
      const [newDaily] = await dbConnectionManager.query(insertQuery, [today]);
      
      if (newDaily && newDaily.pokemon_id) {
        return getPokemonById(newDaily.pokemon_id);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting global daily Pokémon:', error);
    return null;
  }
}

// Helper function to get a Pokémon by ID
async function getPokemonById(id: number): Promise<Pokemon> {
  const query = `
    WITH max_stats AS (
      SELECT pokemon_id, MAX(base_value) as max_value
      FROM pokemon_stats
      GROUP BY pokemon_id
    ),
    highest_stats AS (
      SELECT 
        ps.pokemon_id,
        array_agg(ps.stat_name ORDER BY ps.stat_name) as highest_stats,
        MAX(ps.base_value) as highest_stat_value
      FROM pokemon_stats ps
      JOIN max_stats ms ON ps.pokemon_id = ms.pokemon_id 
      WHERE ps.base_value = ms.max_value
      GROUP BY ps.pokemon_id
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
      p.sprite_default,
      p.sprite_official,
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

// Helper function to check if a Pokémon ID is in the selected generations
function isInGenerations(pokemonId: number, generations: number[]): boolean {
  const genRanges = getIdRangesForGenerations(generations);
  return genRanges.some(range => 
    pokemonId >= range.start && pokemonId <= range.end
  );
}