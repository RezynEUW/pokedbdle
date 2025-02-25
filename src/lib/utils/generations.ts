// /src/lib/utils/generations.ts

// Define generation ID ranges
export const GENERATION_RANGES = [
    { gen: 1, start: 1, end: 151 },     // Gen 1: 1-151
    { gen: 2, start: 152, end: 251 },   // Gen 2: 152-251
    { gen: 3, start: 252, end: 386 },   // Gen 3: 252-386
    { gen: 4, start: 387, end: 493 },   // Gen 4: 387-493
    { gen: 5, start: 494, end: 649 },   // Gen 5: 494-649
    { gen: 6, start: 650, end: 721 },   // Gen 6: 650-721
    { gen: 7, start: 722, end: 809 },   // Gen 7: 722-809
    { gen: 8, start: 810, end: 905 },   // Gen 8: 810-905
    { gen: 9, start: 906, end: 1025 }   // Gen 9: 906-1025
  ];
  
  /**
   * Convert generation numbers to ID ranges for SQL filtering
   */
  export function getIdRangesForGenerations(generations: number[]): { start: number; end: number }[] {
    // Default to all generations if none specified
    if (!generations || generations.length === 0) {
      return GENERATION_RANGES.map(({ start, end }) => ({ start, end }));
    }
    
    return generations
      .map(gen => {
        const range = GENERATION_RANGES.find(r => r.gen === gen);
        if (!range) {
          console.warn(`Invalid generation: ${gen}, skipping`);
          return null;
        }
        return { start: range.start, end: range.end };
      })
      .filter((range): range is { start: number; end: number } => range !== null);
  }
  
  /**
   * Build a SQL WHERE clause for the given generation IDs
   */
  export function buildIdRangeCondition(generations: number[]): string {
    const ranges = getIdRangesForGenerations(generations);
    
    if (ranges.length === 0) {
      // Default to all generations if none valid
      return '1=1'; // Match all
    }
    
    return ranges
      .map(range => `(p.id BETWEEN ${range.start} AND ${range.end})`)
      .join(' OR ');
  }
  
  /**
   * Check if a Pokémon ID belongs to any of the specified generations
   */
  export function isPokemonInGenerations(pokemonId: number, generations: number[]): boolean {
    const ranges = getIdRangesForGenerations(generations);
    return ranges.some(range => pokemonId >= range.start && pokemonId <= range.end);
  }