// src/lib/db/pokemon.ts
import { neon } from '@neondatabase/serverless';
import { Pokemon } from '@/types/pokemon';

export async function searchPokemon(query: string, limit = 10): Promise<Pokemon[]> {
  const sql = neon(process.env.DATABASE_URL!);

  const results = await sql`
    WITH max_stats AS (
      SELECT pokemon_id, MAX(base_value) as max_value
      FROM pokemon_stats
      GROUP BY pokemon_id
    ),
    highest_stats AS (
      SELECT 
        ps.pokemon_id,
        string_agg(
          CASE 
            WHEN ps.stat_name = 'special-attack' THEN 'Special Attack'
            WHEN ps.stat_name = 'special-defense' THEN 'Special Defense'
            ELSE INITCAP(ps.stat_name)
          END,
          ', ' ORDER BY ps.stat_name
        ) as highest_stats,
        MAX(ps.base_value) as highest_stat_value
      FROM pokemon_stats ps
      JOIN max_stats ms ON ps.pokemon_id = ms.pokemon_id
      WHERE ps.base_value = ms.max_value
      GROUP BY ps.pokemon_id
    )
    SELECT 
      p.*,
      array_agg(DISTINCT pt.type_name) as types,
      array_agg(DISTINCT pa.ability_name) as abilities,
      COALESCE(hs.highest_stats, '') as highest_stats,
      COALESCE(hs.highest_stat_value, 0) as highest_stat_value
    FROM pokemon p
    LEFT JOIN pokemon_types pt ON p.id = pt.pokemon_id
    LEFT JOIN pokemon_abilities pa ON p.id = pa.pokemon_id
    LEFT JOIN highest_stats hs ON p.id = hs.pokemon_id
    WHERE p.name ILIKE ${`%${query}%`}
    GROUP BY p.id, hs.highest_stats, hs.highest_stat_value
    LIMIT ${limit}
  `;

  return results.map(p => ({
    id: p.id,
    name: p.name,
    generation: p.generation,
    types: p.types?.filter(Boolean) || [],
    color: p.color,
    evolution_stage: p.evolution_stage,
    height: p.height,
    weight: p.weight,
    base_stat_total: p.base_stat_total,
    highest_stats: p.highest_stats ? p.highest_stats.split(', ').filter(Boolean) : [],
    highest_stat_value: p.highest_stat_value || 0,
    abilities: p.abilities?.filter(Boolean) || [],
    egg_groups: [],
    habitat: '',
    sprite_default: p.sprite_default,
    sprite_official: p.sprite_official,
    sprite_shiny: p.sprite_shiny  // Add this line
  }));
}

export async function getPokemonById(id: number): Promise<Pokemon | null> {
  const sql = neon(process.env.DATABASE_URL!);

  const [result] = await sql`
    WITH max_stats AS (
      SELECT pokemon_id, MAX(base_value) as max_value
      FROM pokemon_stats
      GROUP BY pokemon_id
    ),
    highest_stats AS (
      SELECT 
        ps.pokemon_id,
        string_agg(
          CASE 
            WHEN ps.stat_name = 'special-attack' THEN 'Special Attack'
            WHEN ps.stat_name = 'special-defense' THEN 'Special Defense'
            ELSE INITCAP(ps.stat_name)
          END,
          ', ' ORDER BY ps.stat_name
        ) as highest_stats,
        MAX(ps.base_value) as highest_stat_value
      FROM pokemon_stats ps
      JOIN max_stats ms ON ps.pokemon_id = ms.pokemon_id
      WHERE ps.base_value = ms.max_value
      GROUP BY ps.pokemon_id
    )
    SELECT 
      p.*,
      array_agg(DISTINCT pt.type_name) as types,
      array_agg(DISTINCT pa.ability_name) as abilities,
      COALESCE(hs.highest_stats, '') as highest_stats,
      COALESCE(hs.highest_stat_value, 0) as highest_stat_value
    FROM pokemon p
    LEFT JOIN pokemon_types pt ON p.id = pt.pokemon_id
    LEFT JOIN pokemon_abilities pa ON p.id = pa.pokemon_id
    LEFT JOIN highest_stats hs ON p.id = hs.pokemon_id
    WHERE p.id = ${id}
    GROUP BY p.id, hs.highest_stats, hs.highest_stat_value
  `;

  if (!result) return null;

  return {
    id: result.id,
    name: result.name,
    generation: result.generation,
    types: result.types?.filter(Boolean) || [],
    color: result.color,
    evolution_stage: result.evolution_stage,
    height: result.height,
    weight: result.weight,
    base_stat_total: result.base_stat_total,
    highest_stats: result.highest_stats ? result.highest_stats.split(', ').filter(Boolean) : [],
    highest_stat_value: result.highest_stat_value || 0,
    abilities: result.abilities?.filter(Boolean) || [],
    egg_groups: [],
    habitat: '',
    sprite_default: result.sprite_default,
    sprite_official: result.sprite_official,
    sprite_shiny: result.sprite_shiny  // Add this line
  };
}