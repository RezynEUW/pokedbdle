import { neon } from '@neondatabase/serverless';

// Check if we have the database URL
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

// Create and export the SQL template tag
export const sql = neon(process.env.DATABASE_URL);

// More specific type for database rows
export interface DbRow {
  name: string;
  id: number;
  // Use a more restrictive type instead of any
  [key: string]: string | number | boolean | null;
}

// Alternative approach: use a generic type parameter
export interface GenericDbRow<T = Record<string, string | number | boolean | null>> {
  name: string;
  id: number;
  additionalFields?: T;
}