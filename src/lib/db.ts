import { neon } from '@neondatabase/serverless';

// Check if we have the database URL
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

// Create and export the SQL template tag
export const sql = neon(process.env.DATABASE_URL);

// Type for our database rows
export interface DbRow {
  name: string;
  id: number;
  [key: string]: any;
}