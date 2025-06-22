// Import the shared db pool from db.ts
import pool from '../db.js';

// Define an interface for the function's return type for better type safety
interface IVariantsResponse {
    variants: any[]; // The actual rows of data
    totalCount: number; // The total number of variants in the database
};

interface ICountResult {
    name: string;
    value: number;
}

interface ISummaryResponse {
    significanceCounts: ICountResult[];
    typeCounts: ICountResult[];
}

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

/**
 * Fetches a single variant by its ID.
 * @param id The ID of the variant to retrieve.
 * @returns The variant object if found, or null if not found.
 * @throws Error if the database query fails.
 */

export const getVariantById = async (id: number): Promise<any | null> => {
    // Parameterized query to prevent SQL injection
    const query = 'SELECT * FROM variants WHERE id = $1';

    const result = await pool.query(query, [id]);

    // If no rows are returned, return null
    result.rows[0] ?? null;
    // If a row is found, return the first row
}

/**
 * Fetches aggregated counts for variant types and clinical significances
 */
export const getVariantSummaryData = async (): Promise<ISummaryResponse> => {
    // Query to count variant grouped by clinical_significance
    const significanceQuery = `
    SELECT variant_type as name, COUNT(*) as value
    FROM variants
    WHERE variant_type IS NOT NULL
    GROUP BY variant_type
    ORDER BY value DESC;
    `;

    const typeQuery = `
    SELECT variant_type as name, COUNT(*) as value
    FROM variants
    WHERE variant_type IS NOT NULL
    GROUP BY variant_type
    ORDER BY value DESC;
    `;

    // Run both agg queries concurrently using Promise.all
    const [significanceResult, typeResult] = await Promise.all([
        pool.query(significanceQuery),
        pool.query(typeQuery)
    ]);

    // The database returns the count from COUNT(*) as a string, so parse it
    const significanceCounts = significanceResult.rows.map(row => ({
        name: row.name,
        value: parseInt(row.value, 10)
    }));

    const typeCounts = typeResult.rows.map(row => ({
        name: row.name,
        value: parseInt(row.value, 10)
    }));

    // Return the final, structured object
    return {
        significanceCounts,
        typeCounts,
    }
}