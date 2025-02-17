// src/types/pokemon.ts
export interface Pokemon {
    id: number;
    name: string;
    generation: string;
    types: string[];
    color: string;
    evolution_stage: 'stage1' | 'stage2' | 'stage3';
    height: number;
    weight: number;
    base_stat_total: number;
    highest_stat: string;
    abilities: string[];
    egg_groups: string[];
    habitat: string;
    sprite_default: string;
    sprite_official: string;
  }