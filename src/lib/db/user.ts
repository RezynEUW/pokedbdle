// src/lib/db/user.ts
import { neon } from '@neondatabase/serverless';

export interface GameStreak {
  currentStreak: number;
  maxStreak: number;
}

export async function updateGameStreak(userId: number, isGameWon: boolean): Promise<GameStreak> {
  const sql = neon(process.env.DATABASE_URL!);
  
  try {
    const [result] = await sql`
      WITH current_streak AS (
        SELECT 
          COALESCE(MAX(
            CASE 
              WHEN completed = true THEN current_streak 
              ELSE 0 
            END
          ), 0) as streak,
          COALESCE(MAX(
            CASE 
              WHEN completed = true THEN max_streak 
              ELSE 0 
            END
          ), 0) as max_streak
        FROM (
          SELECT 
            completed,
            (
              SELECT COUNT(*) 
              FROM user_guesses ug2 
              WHERE 
                ug2.user_id = ${userId} AND 
                ug2.completed = true AND 
                ug2.date < ug1.date
            ) + 1 as current_streak,
            (
              SELECT COALESCE(MAX(
                (
                  SELECT COUNT(*) 
                  FROM user_guesses ug3 
                  WHERE 
                    ug3.user_id = ${userId} AND 
                    ug3.completed = true AND 
                    ug3.date < ug1.date
                ) + 1
              ), 0)
              FROM user_guesses ug2
              WHERE ug2.user_id = ${userId}
            ) as max_streak
          FROM user_guesses ug1
          WHERE 
            ug1.user_id = ${userId} AND 
            ug1.completed = true
          ORDER BY ug1.date DESC
          LIMIT 1
        ) subquery
      )
      UPDATE user_guesses
      SET 
        current_streak = CASE 
          WHEN ${isGameWon} THEN COALESCE(current_streak, 0) + 1 
          ELSE 0 
        END,
        max_streak = GREATEST(
          CASE 
            WHEN ${isGameWon} THEN COALESCE(current_streak, 0) + 1 
            ELSE 0 
          END, 
          (SELECT max_streak FROM current_streak)
        )
      WHERE 
        user_id = ${userId} AND 
        date = CURRENT_DATE
      RETURNING 
        COALESCE(current_streak, 0) as current_streak, 
        COALESCE(max_streak, 0) as max_streak
    `;

    return {
      currentStreak: parseInt(result.current_streak),
      maxStreak: parseInt(result.max_streak)
    };
  } catch (error) {
    console.error('Error updating game streak:', error);
    throw error;
  }
}

export default {
  updateGameStreak
};