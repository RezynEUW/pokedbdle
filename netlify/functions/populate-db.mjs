// netlify/functions/populate-db.mjs
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function fetchWithRetry(url, retries = 3) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(url, retries - 1);
    }
    throw error;
  }
}

async function processCompletePokemon(id, pokemon, species) {
  try {
    const sprites = pokemon.sprites;
    const statTotal = pokemon.stats.reduce((sum, stat) => sum + stat.base_stat, 0);

    // Insert core pokemon data
    await sql`
      INSERT INTO pokemon (
        id, name, generation, color, evolution_stage,
        height, weight, base_stat_total, base_experience,
        is_default, order_number, sprite_default, sprite_shiny,
        sprite_official, sprite_dream_world, sprite_home,
        sprite_home_shiny, cry_latest, cry_legacy,
        gender_rate, capture_rate, base_happiness,
        is_baby, is_legendary, is_mythical,
        hatch_counter, has_gender_differences,
        forms_switchable, growth_rate_name
      ) VALUES (
        ${pokemon.id},
        ${pokemon.name},
        ${species.generation.name},
        ${species.color.name},
        ${species.evolves_from_species ? (species.evolves_from_species.evolves_from_species ? 'stage3' : 'stage2') : 'stage1'},
        ${pokemon.height},
        ${pokemon.weight},
        ${statTotal},
        ${pokemon.base_experience},
        ${pokemon.is_default},
        ${pokemon.order_number},
        ${sprites.front_default},
        ${sprites.front_shiny},
        ${sprites.other['official-artwork'].front_default},
        ${sprites.other.dream_world?.front_default},
        ${sprites.other.home?.front_default},
        ${sprites.other.home?.front_shiny},
        ${pokemon.cries?.latest},
        ${pokemon.cries?.legacy},
        ${species.gender_rate},
        ${species.capture_rate},
        ${species.base_happiness},
        ${species.is_baby},
        ${species.is_legendary},
        ${species.is_mythical},
        ${species.hatch_counter},
        ${species.has_gender_differences},
        ${species.forms_switchable},
        ${species.growth_rate?.name}
      )
      ON CONFLICT (id) DO UPDATE SET
        updated_at = CURRENT_TIMESTAMP
    `;

    // Insert types
    for (const type of pokemon.types) {
      await sql`
        INSERT INTO pokemon_types (pokemon_id, type_name, slot)
        VALUES (${id}, ${type.type.name}, ${type.slot})
        ON CONFLICT (pokemon_id, type_name) DO NOTHING
      `;
    }

    // Insert past types
    for (const pastType of pokemon.past_types || []) {
      for (const type of pastType.types) {
        await sql`
          INSERT INTO pokemon_past_types (pokemon_id, generation_name, type_name, slot)
          VALUES (${id}, ${pastType.generation.name}, ${type.type.name}, ${type.slot})
          ON CONFLICT (pokemon_id, generation_name, type_name) DO NOTHING
        `;
      }
    }

    // Insert abilities
    for (const ability of pokemon.abilities) {
      await sql`
        INSERT INTO pokemon_abilities (pokemon_id, ability_name, is_hidden, slot)
        VALUES (${id}, ${ability.ability.name}, ${ability.is_hidden}, ${ability.slot})
        ON CONFLICT (pokemon_id, ability_name) DO NOTHING
      `;
    }

    // Insert egg groups
    for (const group of species.egg_groups) {
      await sql`
        INSERT INTO pokemon_egg_groups (pokemon_id, egg_group_name)
        VALUES (${id}, ${group.name})
        ON CONFLICT (pokemon_id, egg_group_name) DO NOTHING
      `;
    }

    // Insert stats
    const maxBaseStat = Math.max(...pokemon.stats.map(s => s.base_stat));
    for (const stat of pokemon.stats) {
      await sql`
        INSERT INTO pokemon_stats (pokemon_id, stat_name, base_value, effort_value, is_highest)
        VALUES (
          ${id}, 
          ${stat.stat.name}, 
          ${stat.base_stat},
          ${stat.effort},
          ${stat.base_stat === maxBaseStat}
        )
        ON CONFLICT (pokemon_id, stat_name) DO NOTHING
      `;
    }

    // Insert flavor text (English only)
    for (const flavorText of species.flavor_text_entries) {
      if (flavorText.language.name === 'en') {
        await sql`
          INSERT INTO pokemon_flavor_text (
            pokemon_id, flavor_text, version_name, language_code
          )
          VALUES (
            ${id},
            ${flavorText.flavor_text.replace(/\n/g, ' ').replace(/\f/g, ' ')},
            ${flavorText.version.name},
            'en'
          )
          ON CONFLICT (pokemon_id, version_name, language_code) DO NOTHING
        `;
      }
    }

    // Insert genera (English only)
    const englishGenus = species.genera.find(g => g.language.name === 'en');
    if (englishGenus) {
      await sql`
        INSERT INTO pokemon_genera (pokemon_id, genus, language_code)
        VALUES (${id}, ${englishGenus.genus}, 'en')
        ON CONFLICT (pokemon_id, language_code) DO NOTHING
      `;
    }

    console.log(`Successfully processed Pokemon #${id} (${pokemon.name})`);
    return true;
  } catch (error) {
    console.error(`Error processing Pokemon #${id}:`, error);
    return false;
  }
}

export const handler = async (event) => {
  try {
    const START_ID = 1;
    const END_ID = 1025;
    let successCount = 0;
    let failureCount = 0;

    for (let id = START_ID; id <= END_ID; id++) {
      try {
        console.log(`Fetching Pokemon #${id}...`);
        
        const [pokemon, species] = await Promise.all([
          fetchWithRetry(`https://pokeapi.co/api/v2/pokemon/${id}`),
          fetchWithRetry(`https://pokeapi.co/api/v2/pokemon-species/${id}`)
        ]);

        const success = await processCompletePokemon(id, pokemon, species);
        
        if (success) {
          successCount++;
        } else {
          failureCount++;
        }

        // Small delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error processing Pokemon #${id}:`, error);
        failureCount++;
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Database population complete',
        successful: successCount,
        failed: failureCount,
        total: END_ID - START_ID + 1
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};