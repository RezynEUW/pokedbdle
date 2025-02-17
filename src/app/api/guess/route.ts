import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  if (!name) {
    return NextResponse.json({ error: 'Name parameter is required' }, { status: 400 });
  }

  try {
    const sql = neon(process.env.DATABASE_URL!);

    const pokemon = await sql`
      SELECT 
        p.id, 
        p.name, 
        p.generation, 
        p.color,
        p.evolution_stage, 
        p.height, 
        p.weight,
        p.sprite_official,
        array_agg(DISTINCT pt.type_name) as types
      FROM pokemon p
      LEFT JOIN pokemon_types pt ON p.id = pt.pokemon_id
      WHERE p.name = ${name.toLowerCase()}
      GROUP BY p.id
    `;

    if (!pokemon.length) {
      return NextResponse.json({ error: 'Pokemon not found' }, { status: 404 });
    }

    // Format the pokemon object to match our type
    const formattedPokemon = {
      ...pokemon[0],
      types: pokemon[0].types ? pokemon[0].types.filter(Boolean) : []
    };

    return NextResponse.json(formattedPokemon);
  } catch (error) {
    console.error('Error getting pokemon:', error);
    return NextResponse.json({ error: 'Failed to get pokemon' }, { status: 500 });
  }
}
