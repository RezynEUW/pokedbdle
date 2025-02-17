// src/types/database.ts
import { neon } from '@neondatabase/serverless';
import { Pokemon } from '@/types/pokemon';

export async function getPokemonWithStats(name: string): Promise<Pokemon | null> {
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
        array_agg(ps.stat_name ORDER BY ps.stat_name) as highest_stats,
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
      array_agg(DISTINCT peg.egg_group_name) as egg_groups,
      COALESCE(hs.highest_stats, ARRAY[]::text[]) as highest_stats,
      COALESCE(hs.highest_stat_value, 0) as highest_stat_value
    FROM pokemon p
    LEFT JOIN pokemon_types pt ON p.id = pt.pokemon_id
    LEFT JOIN pokemon_abilities pa ON p.id = pa.pokemon_id
    LEFT JOIN pokemon_egg_groups peg ON p.id = peg.pokemon_id
    LEFT JOIN highest_stats hs ON p.id = hs.pokemon_id
    WHERE LOWER(p.name) = LOWER(${name})
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
    highest_stats: result.highest_stats || [],
    highest_stat_value: result.highest_stat_value || 0,
    abilities: result.abilities?.filter(Boolean) || [],
    egg_groups: result.egg_groups?.filter(Boolean) || [],
    habitat: result.habitat || '',
    sprite_default: result.sprite_default,
    sprite_official: result.sprite_official
  };
}