import { neon } from '@neondatabase/serverless';

// Check if we have the database URL
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

// Connection cache
let sqlInstance: any = null;
let lastConnectionTime = Date.now();

// Get a SQL connection, creating a new one if needed or if the existing one is stale
export function getSql() {
  const now = Date.now();
  
  // If it's been more than 30 minutes since we last created a connection, force a new one
  if (!sqlInstance || now - lastConnectionTime > 30 * 60 * 1000) {
    try {
      console.log('Creating new Neon database connection');
      sqlInstance = neon(process.env.DATABASE_URL!);
      lastConnectionTime = now;
    } catch (error) {
      console.error('Error creating database connection:', error);
      // Fall back to creating a basic connection if the memoized one fails
      sqlInstance = neon(process.env.DATABASE_URL!);
    }
  }
  
  return sqlInstance;
}

// Export a simple SQL template tag for basic queries
export const sql = (...args: Parameters<typeof getSql>) => getSql()(...args);

// Execute a query with retries to handle transient connection issues
export async function queryWithRetry<T = any>(
  query: string, 
  params?: any[], 
  options: { retries?: number; logQuery?: boolean } = {}
): Promise<T> {
  const { retries = 3, logQuery = false } = options;
  let lastError;
  
  if (logQuery) {
    console.log(`Executing query: ${query.slice(0, 100)}${query.length > 100 ? '...' : ''}`);
    if (params) console.log('Params:', params);
  }
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const dbSql = getSql();
      return await dbSql(query, params);
    } catch (error: any) {
      console.error(`Database query failed (attempt ${attempt + 1}):`, error.message);
      lastError = error;
      
      // Force a new connection on the next attempt
      if (attempt < retries - 1) {
        console.log('Resetting connection for retry...');
        sqlInstance = null;
        lastConnectionTime = 0; // Force a new connection on the next attempt
        
        // Wait before retry (exponential backoff)
        const delay = 500 * Math.pow(2, attempt);
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  
  // If we exhausted all retries, throw the last error
  throw lastError;
}

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