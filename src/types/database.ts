// src/lib/db/pokemon.ts
import { neon } from '@neondatabase/serverless';
import { Pokemon } from '@/types/pokemon';

export async function searchPokemon(query: string, limit = 10): Promise<Pokemon[]> {
  const sql = neon(process.env.DATABASE_URL!);

  try {
    const pokemon = await sql`
      SELECT 
        p.*,
        array_agg(DISTINCT pt.type_name) as types,
        array_agg(DISTINCT pa.ability_name) as abilities,
        array_agg(DISTINCT peg.egg_group_name) as egg_groups
      FROM pokemon p
      LEFT JOIN pokemon_types pt ON p.id = pt.pokemon_id
      LEFT JOIN pokemon_abilities pa ON p.id = pa.pokemon_id
      LEFT JOIN pokemon_egg_groups peg ON p.id = peg.pokemon_id
      WHERE p.name ILIKE ${`%${query}%`}
      GROUP BY p.id
      LIMIT ${limit}
    `;

    return pokemon.map(p => ({
      id: p.id,
      name: p.name,
      generation: p.generation,
      types: p.types || [],
      color: p.color,
      evolution_stage: p.evolution_stage,
      height: p.height,
      weight: p.weight,
      base_stat_total: p.base_stat_total,
      highest_stat: p.highest_stat || '',
      abilities: p.abilities || [],
      egg_groups: p.egg_groups || [],
      habitat: '', // No habitat column in the schema
      sprite_default: p.sprite_default,
      sprite_official: p.sprite_official
    }));
  } catch (error) {
    console.error('Error searching pokemon:', error);
    throw error;
  }
}

export async function getPokemonById(id: number): Promise<Pokemon | null> {
  const sql = neon(process.env.DATABASE_URL!);

  try {
    const [pokemon] = await sql`
      SELECT 
        p.*,
        array_agg(DISTINCT pt.type_name) as types,
        array_agg(DISTINCT pa.ability_name) as abilities,
        array_agg(DISTINCT peg.egg_group_name) as egg_groups
      FROM pokemon p
      LEFT JOIN pokemon_types pt ON p.id = pt.pokemon_id
      LEFT JOIN pokemon_abilities pa ON p.id = pa.pokemon_id
      LEFT JOIN pokemon_egg_groups peg ON p.id = peg.pokemon_id
      WHERE p.id = ${id}
      GROUP BY p.id
    `;

    return pokemon ? {
      id: pokemon.id,
      name: pokemon.name,
      generation: pokemon.generation,
      types: pokemon.types || [],
      color: pokemon.color,
      evolution_stage: pokemon.evolution_stage,
      height: pokemon.height,
      weight: pokemon.weight,
      base_stat_total: pokemon.base_stat_total,
      highest_stat: pokemon.highest_stat || '',
      abilities: pokemon.abilities || [],
      egg_groups: pokemon.egg_groups || [],
      habitat: '', // No habitat column in the schema
      sprite_default: pokemon.sprite_default,
      sprite_official: pokemon.sprite_official
    } : null;
  } catch (error) {
    console.error('Error fetching pokemon by ID:', error);
    throw error;
  }
}

export default {
  searchPokemon,
  getPokemonById
};