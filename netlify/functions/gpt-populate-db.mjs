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

function determineEvolutionStage(pokemon, species) {
  if (!species.evolves_from_species) return 'stage1';
  return 'stage2';
}

async function insertPokemon(pokemonData, speciesData) {
  const baseStatTotal = pokemonData.stats.reduce((sum, stat) => sum + stat.base_stat, 0);
  let officialArtwork = null;
  if (pokemonData.sprites?.other?.['official-artwork']) {
    officialArtwork = pokemonData.sprites.other['official-artwork'].front_default;
  }
  await sql`
    INSERT INTO pokemon (
      id, name, generation, color, evolution_stage, height, weight, base_stat_total, sprite_default, sprite_shiny, sprite_official
    ) VALUES (
      ${pokemonData.id},
      ${pokemonData.name},
      ${speciesData.generation.name},
      ${speciesData.color.name},
      ${determineEvolutionStage(pokemonData, speciesData)},
      ${pokemonData.height},
      ${pokemonData.weight},
      ${baseStatTotal},
      ${pokemonData.sprites.front_default},
      ${pokemonData.sprites.front_shiny},
      ${officialArtwork}
    )
    ON CONFLICT (id) DO NOTHING
  `;
  if (pokemonData.types) {
    for (const type of pokemonData.types) {
      await sql`
        INSERT INTO pokemon_types (pokemon_id, type_name, slot)
        VALUES (${pokemonData.id}, ${type.type.name}, ${type.slot})
        ON CONFLICT DO NOTHING
      `;
    }
  }
  if (pokemonData.abilities) {
    for (const ability of pokemonData.abilities) {
      await sql`
        INSERT INTO pokemon_abilities (pokemon_id, ability_name, is_hidden)
        VALUES (${pokemonData.id}, ${ability.ability.name}, ${ability.is_hidden})
        ON CONFLICT DO NOTHING
      `;
    }
  }
  if (speciesData.egg_groups) {
    for (const eggGroup of speciesData.egg_groups) {
      await sql`
        INSERT INTO pokemon_egg_groups (pokemon_id, egg_group_name)
        VALUES (${pokemonData.id}, ${eggGroup.name})
        ON CONFLICT DO NOTHING
      `;
    }
  }
  const maxBaseStat = Math.max(...pokemonData.stats.map(s => s.base_stat));
  if (pokemonData.stats) {
    for (const stat of pokemonData.stats) {
      await sql`
        INSERT INTO pokemon_stats (pokemon_id, stat_name, base_stat, is_highest)
        VALUES (${pokemonData.id}, ${stat.stat.name}, ${stat.base_stat}, ${stat.base_stat === maxBaseStat})
        ON CONFLICT DO NOTHING
      `;
    }
  }
  if (pokemonData.forms) {
    for (const form of pokemonData.forms) {
      await sql`
        INSERT INTO pokemon_forms (pokemon_id, form_name, form_url)
        VALUES (${pokemonData.id}, ${form.name}, ${form.url})
        ON CONFLICT DO NOTHING
      `;
    }
  }
  if (pokemonData.game_indices) {
    for (const gi of pokemonData.game_indices) {
      await sql`
        INSERT INTO pokemon_game_indices (pokemon_id, game_index, version_name, version_url)
        VALUES (${pokemonData.id}, ${gi.game_index}, ${gi.version.name}, ${gi.version.url})
        ON CONFLICT DO NOTHING
      `;
    }
  }
  if (pokemonData.held_items) {
    for (const held of pokemonData.held_items) {
      await sql`
        INSERT INTO pokemon_held_items (pokemon_id, item_name, item_url)
        VALUES (${pokemonData.id}, ${held.item.name}, ${held.item.url})
        ON CONFLICT DO NOTHING
      `;
      if (held.version_details) {
        for (const detail of held.version_details) {
          await sql`
            INSERT INTO pokemon_held_item_details (pokemon_id, item_name, rarity, version_name, version_url)
            VALUES (${pokemonData.id}, ${held.item.name}, ${detail.rarity}, ${detail.version.name}, ${detail.version.url})
            ON CONFLICT DO NOTHING
          `;
        }
      }
    }
  }
  if (pokemonData.moves) {
    for (const moveObj of pokemonData.moves) {
      await sql`
        INSERT INTO pokemon_moves (pokemon_id, move_name, move_url)
        VALUES (${pokemonData.id}, ${moveObj.move.name}, ${moveObj.move.url})
        ON CONFLICT DO NOTHING
      `;
      if (moveObj.version_group_details) {
        for (const detail of moveObj.version_group_details) {
          await sql`
            INSERT INTO pokemon_move_details (
              pokemon_id, move_name, level_learned_at, version_group_name, version_group_url, move_learn_method_name, move_learn_method_url
            )
            VALUES (
              ${pokemonData.id},
              ${moveObj.move.name},
              ${detail.level_learned_at},
              ${detail.version_group.name},
              ${detail.version_group.url},
              ${detail.move_learn_method.name},
              ${detail.move_learn_method.url}
            )
            ON CONFLICT DO NOTHING
          `;
        }
      }
    }
  }
  if (pokemonData.sprites) {
    await sql`
      INSERT INTO pokemon_sprites (pokemon_id, sprites_json)
      VALUES (${pokemonData.id}, ${JSON.stringify(pokemonData.sprites)})
      ON CONFLICT (pokemon_id) DO UPDATE SET sprites_json = EXCLUDED.sprites_json
    `;
  }
  if (pokemonData.cries) {
    await sql`
      INSERT INTO pokemon_cries (pokemon_id, latest, legacy)
      VALUES (${pokemonData.id}, ${pokemonData.cries.latest}, ${pokemonData.cries.legacy})
      ON CONFLICT DO NOTHING
    `;
  }
  if (pokemonData.past_types) {
    for (const past of pokemonData.past_types) {
      if (past.types) {
        for (const pt of past.types) {
          await sql`
            INSERT INTO pokemon_past_types (pokemon_id, generation_name, type_name, slot)
            VALUES (${pokemonData.id}, ${past.generation.name}, ${pt.type.name}, ${pt.slot})
            ON CONFLICT DO NOTHING
          `;
        }
      }
    }
  }
  console.log(`Successfully inserted Pokemon #${pokemonData.id} (${pokemonData.name})`);
  return true;
}

async function insertSpecies(speciesData) {
  await sql`
    INSERT INTO pokemon_species (
      id, name, order_num, gender_rate, capture_rate, base_happiness, is_baby, is_legendary, is_mythical, hatch_counter, has_gender_differences, forms_switchable, growth_rate_name, growth_rate_url, color, shape, evolves_from_species, evolution_chain_url, habitat, generation
    ) VALUES (
      ${speciesData.id},
      ${speciesData.name},
      ${speciesData.order},
      ${speciesData.gender_rate},
      ${speciesData.capture_rate},
      ${speciesData.base_happiness},
      ${speciesData.is_baby},
      ${speciesData.is_legendary},
      ${speciesData.is_mythical},
      ${speciesData.hatch_counter},
      ${speciesData.has_gender_differences},
      ${speciesData.forms_switchable},
      ${speciesData.growth_rate.name},
      ${speciesData.growth_rate.url},
      ${speciesData.color.name},
      ${speciesData.shape.name},
      ${speciesData.evolves_from_species ? speciesData.evolves_from_species.name : null},
      ${speciesData.evolution_chain.url},
      ${speciesData.habitat ? speciesData.habitat.name : null},
      ${speciesData.generation.name}
    )
    ON CONFLICT (id) DO NOTHING
  `;
  if (speciesData.pokedex_numbers) {
    for (const dex of speciesData.pokedex_numbers) {
      await sql`
        INSERT INTO pokemon_species_pokedex_numbers (species_id, entry_number, pokedex_name, pokedex_url)
        VALUES (${speciesData.id}, ${dex.entry_number}, ${dex.pokedex.name}, ${dex.pokedex.url})
        ON CONFLICT DO NOTHING
      `;
    }
  }
  if (speciesData.egg_groups) {
    for (const egg of speciesData.egg_groups) {
      await sql`
        INSERT INTO pokemon_species_egg_groups (species_id, egg_group_name, egg_group_url)
        VALUES (${speciesData.id}, ${egg.name}, ${egg.url})
        ON CONFLICT DO NOTHING
      `;
    }
  }
  if (speciesData.names) {
    for (const nameObj of speciesData.names) {
      await sql`
        INSERT INTO pokemon_species_names (species_id, language, species_name)
        VALUES (${speciesData.id}, ${nameObj.language.name}, ${nameObj.name})
        ON CONFLICT DO NOTHING
      `;
    }
  }
  if (speciesData.flavor_text_entries) {
    for (const flavor of speciesData.flavor_text_entries) {
      if (flavor.language.name === 'en') {
        await sql`
          INSERT INTO pokemon_species_flavor_texts (species_id, flavor_text, language, version_name, version_url)
          VALUES (${speciesData.id}, ${flavor.flavor_text}, ${flavor.language.name}, ${flavor.version.name}, ${flavor.version.url})
          ON CONFLICT DO NOTHING
        `;
      }
    }
  }
  if (speciesData.form_descriptions) {
    for (const formDesc of speciesData.form_descriptions) {
      await sql`
        INSERT INTO pokemon_species_form_descriptions (species_id, description, language)
        VALUES (${speciesData.id}, ${formDesc.description}, ${formDesc.language.name})
        ON CONFLICT DO NOTHING
      `;
    }
  }
  if (speciesData.genera) {
    for (const genus of speciesData.genera) {
      if (genus.language.name === 'en') {
        await sql`
          INSERT INTO pokemon_species_genera (species_id, genus, language)
          VALUES (${speciesData.id}, ${genus.genus}, ${genus.language.name})
          ON CONFLICT DO NOTHING
        `;
      }
    }
  }
  if (speciesData.varieties) {
    for (const variety of speciesData.varieties) {
      await sql`
        INSERT INTO pokemon_species_varieties (species_id, is_default, pokemon_name, pokemon_url)
        VALUES (${speciesData.id}, ${variety.is_default}, ${variety.pokemon.name}, ${variety.pokemon.url})
        ON CONFLICT DO NOTHING
      `;
    }
  }
  console.log(`Successfully inserted Species #${speciesData.id} (${speciesData.name})`);
  return true;
}

export const handler = async (event) => {
  try {
    const START_ID = 1;
    const END_ID = 10;
    let successCount = 0;
    let failureCount = 0;
    for (let id = START_ID; id <= END_ID; id++) {
      try {
        console.log(`Fetching Pokemon and Species #${id}...`);
        const [pokemon, species] = await Promise.all([
          fetchWithRetry(`https://pokeapi.co/api/v2/pokemon/${id}`),
          fetchWithRetry(`https://pokeapi.co/api/v2/pokemon-species/${id}`)
        ]);
        const pSuccess = await insertPokemon(pokemon, species);
        const sSuccess = await insertSpecies(species);
        if (pSuccess && sSuccess) {
          successCount++;
        } else {
          failureCount++;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error processing Pokemon/Species #${id}:`, error);
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
