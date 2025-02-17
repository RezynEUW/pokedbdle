import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!);

    const result: any = await sql`
      SELECT 
        p.id, 
        p.name, 
        p.generation,
        p.color,
        p.evolution_stage,
        p.height,
        p.weight,
        p.sprite_official,
        p.sprite_thumbnail,
        array_agg(DISTINCT pt.type_name) as types,
        array_agg(DISTINCT pa.ability_name) as abilities
      FROM pokemon p
      LEFT JOIN pokemon_types pt ON p.id = pt.pokemon_id
      LEFT JOIN pokemon_abilities pa ON p.id = pa.pokemon_id
      GROUP BY p.id
    `;

    let names: any[] = [];
    if (Array.isArray(result)) {
      names = result;
    } else if (result && Object.keys(result).length > 0) {
      names = [result];
    }
    console.log("pokemon-names =>", names);
    return NextResponse.json(names);
  } catch (error) {
    console.error('Error fetching Pokemon names:', error);
    return NextResponse.json({ error: 'Failed to fetch Pokemon names' }, { status: 500 });
  }
}
