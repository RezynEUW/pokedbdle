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
  highest_stats: string[];  // Changed from highest_stat: string
  highest_stat_value: number;
  abilities: string[];
  egg_groups: string[];
  habitat: string;
  sprite_default: string;
  sprite_official: string;
}