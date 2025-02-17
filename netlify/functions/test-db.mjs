import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const handler = async (event) => {
  // Log to help us debug
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  
  const sql = neon(process.env.DATABASE_URL);
  
  try {
    const result = await sql`SELECT version();`;
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: "Connected to database!",
        version: result[0].version
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: error.message,
        envExists: !!process.env.DATABASE_URL 
      })
    };
  }
};