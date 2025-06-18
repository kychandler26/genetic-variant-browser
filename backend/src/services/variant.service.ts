// Import the shared db pool from db.ts
import pool from '../db.js';

// Define an interface for the function's return type for better type safety
interface IVariantsResponse {
    variants: any[]; // The actual rows of data
    totalCount: number; // The total number of variants in the database
};

/**
 * Fetches a list of variants from the database.
 * @param page The page number to retrieve.
 * @param limit The number of items per page.
 */

export const getAllVariants = async (page: number, limit: number): Promise<IVariantsResponse> => {
    // Calculate the OFFSET for the SQL query
    // OFFSET is how many rows to skip. For page 1, we skip 0 rows. For page 2, we skip 'limit' rows.
    const offset = (page - 1) * limit;

    // Create the two SQL queries to run
    // Parameterized queries ($1, $2) are used to prevent SQL injection
    const dataQuery = 'SELECT * FROM variants ORDER BY id LIMIT $1 OFFSET $2';
    const countQuery = 'SELECT COUNT(*) FROM variants';

    const [dataResult, countResult] = await Promise.all([
        pool.query(dataQuery, [limit, offset]),
        pool.query(countQuery)
    ]);

    // Extract the results from the queries
    const variants = dataResult.rows;
    // The count is a string so it is parsed into an integer
    const totalCount = parseInt(countResult.rows[0].count, 10);

    return {
        variants,
        totalCount
    }
}