// src/lib/game/dailyPokemon.ts
import { neon } from '@neondatabase/serverless';
import { Pokemon } from '@/types/pokemon';

// Seed generator to create consistent daily selection
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export async function getDailyPokemon(): Promise<Pokemon> {
  // Connect to the database
  const sql = neon(process.env.DATABASE_URL!);

  // Generate a seed based on the current date
  const today = new Date();
  const dateSeed = today.getFullYear() * 10000 + 
                   (today.getMonth() + 1) * 100 + 
                   today.getDate();

  try {
    // Get total number of Pokemon
    const [countResult] = await sql`
      SELECT COUNT(*) as total_pokemon FROM pokemon
    `;
    const totalPokemon = parseInt(countResult.total_pokemon);

    // Use seeded random to select a consistent Pokemon for the day
    const randomIndex = Math.floor(seededRandom(dateSeed) * totalPokemon);

    // Fetch the daily Pokemon with all its details
    const [dailyPokemon] = await sql`
      WITH highest_stat AS (
        SELECT 
          pokemon_id, 
          stat_name 
        FROM pokemon_stats 
        WHERE is_highest = true
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
        hs.stat_name AS highest_stat,
        p.sprite_default,
        p.sprite_official,
        array_agg(DISTINCT pt.type_name) as types,
        array_agg(DISTINCT pa.ability_name) as abilities,
        array_agg(DISTINCT peg.egg_group_name) as egg_groups
      FROM pokemon p
      LEFT JOIN pokemon_types pt ON p.id = pt.pokemon_id
      LEFT JOIN pokemon_abilities pa ON p.id = pa.pokemon_id
      LEFT JOIN pokemon_egg_groups peg ON p.id = peg.pokemon_id
      LEFT JOIN highest_stat hs ON p.id = hs.pokemon_id
      WHERE p.id = (
        SELECT id 
        FROM pokemon 
        ORDER BY id 
        LIMIT 1 
        OFFSET ${randomIndex}
      )
      GROUP BY 
        p.id, p.name, p.generation, p.color, p.evolution_stage, 
        p.height, p.weight, p.base_stat_total, 
        p.sprite_default, p.sprite_official, 
        hs.stat_name
    `;

    // Ensure the returned object matches the Pokemon type
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
      highest_stat: dailyPokemon.highest_stat || '',
      abilities: dailyPokemon.abilities || [],
      egg_groups: dailyPokemon.egg_groups || [],
      habitat: '', // No habitat column in the schema
      sprite_default: dailyPokemon.sprite_default,
      sprite_official: dailyPokemon.sprite_official
    };
  } catch (error) {
    console.error('Error selecting daily Pokemon:', error);
    throw error; // Throw the actual error for more detailed debugging
  }
}

// Function to check if a new day has started
export function isNewDay(lastPlayedDate?: string | null): boolean {
  if (!lastPlayedDate) return true;

  const today = new Date();
  const lastPlayed = new Date(lastPlayedDate);

  return (
    today.getFullYear() !== lastPlayed.getFullYear() ||
    today.getMonth() !== lastPlayed.getMonth() ||
    today.getDate() !== lastPlayed.getDate()
  );
}

// Cached daily Pokemon to reduce database calls
let cachedDailyPokemon: Pokemon | null = null;
let cachedDate: string | null = null;

export async function getCachedDailyPokemon(): Promise<Pokemon> {
  const today = new Date().toISOString().split('T')[0];

  // Return cached Pokemon if it's from today
  if (cachedDailyPokemon && cachedDate === today) {
    return cachedDailyPokemon;
  }

  // Fetch and cache the daily Pokemon
  const dailyPokemon = await getDailyPokemon();
  cachedDailyPokemon = dailyPokemon;
  cachedDate = today;

  return dailyPokemon;
}