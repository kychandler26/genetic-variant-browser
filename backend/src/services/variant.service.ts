// Import the shared db pool from db.ts
import pool from '../db.js';

/**
 * Fetches a list of variants from the database.
 * For now it gets the list of the first 25 variants.
 * Still need to add pagination, filtering, and searching.
 */

export const getAllVariants = async () => {
    // Use the pool to run a query against the database
    const result = await pool.query('SELECT * FROM variants LIMIT 25');

    // Return the rows from the result
    return result.rows;
}