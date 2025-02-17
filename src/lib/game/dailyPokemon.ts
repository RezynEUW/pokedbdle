// src/lib/game/dailyPokemon.ts
import { neon } from '@neondatabase/serverless';
import { Pokemon } from '@/types/pokemon';

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export async function getDailyPokemon(): Promise<Pokemon> {
  const sql = neon(process.env.DATABASE_URL!);
  const today = new Date();
  const dateSeed = today.getFullYear() * 10000 + 
                   (today.getMonth() + 1) * 100 + 
                   today.getDate();

  try {
    const [countResult] = await sql`
      SELECT COUNT(*) as total_pokemon FROM pokemon
    `;
    const totalPokemon = parseInt(countResult.total_pokemon);
    const randomIndex = Math.floor(seededRandom(dateSeed) * totalPokemon);

    const [dailyPokemon] = await sql`
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
        array_agg(DISTINCT pt.type_name) as types,
        array_agg(DISTINCT pa.ability_name) as abilities,
        COALESCE(hs.highest_stats, ARRAY[]::text[]) as highest_stats,
        COALESCE(hs.highest_stat_value, 0) as highest_stat_value
      FROM pokemon p
      LEFT JOIN pokemon_types pt ON p.id = pt.pokemon_id
      LEFT JOIN pokemon_abilities pa ON p.id = pa.pokemon_id
      LEFT JOIN highest_stats hs ON p.id = hs.pokemon_id
      WHERE p.id = (
        SELECT id 
        FROM pokemon 
        ORDER BY id 
        LIMIT 1 
        OFFSET ${randomIndex}
      )
      GROUP BY 
        p.id, hs.highest_stats, hs.highest_stat_value
    `;

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
      egg_groups: [],
      habitat: '',
      sprite_default: dailyPokemon.sprite_default,
      sprite_official: dailyPokemon.sprite_official
    };
  } catch (error) {
    console.error('Error selecting daily Pokemon:', error);
    throw error;
  }
}