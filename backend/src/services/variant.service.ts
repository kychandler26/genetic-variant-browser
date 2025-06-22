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
 * @param search Optional search term
 */

export const getAllVariants = async (
  page: number,
  limit: number,
  search?: string
): Promise<IVariantsResponse> => {
  //Start with base queries and an empty array for query parameters.
  let baseDataQuery = 'SELECT * FROM variants';
  let baseCountQuery = 'SELECT COUNT(*) FROM variants';
  const queryParams: any[] = [];

  // Check if search term is provided.
  if (search) {
    // Add the WHERE clause. $1 is our search term.
    const whereClause = ` WHERE gene_name ILIKE $1 OR variant_id ILIKE $1`;
    baseDataQuery += whereClause;
    baseCountQuery += whereClause;
    // Add the search term to the parameters, wrapped in % for pattern matching.
    queryParams.push(`%${search}%`);
  }

  // Add pagination to the main data query.
  // The parameter numbers ($2, $3) must come after any search parameters.
  const paginationClause = ` ORDER BY id LIMIT $${queryParams.length + 1} OFFSET $${
    queryParams.length + 2
  }`;
  baseDataQuery += paginationClause;
  
  // Add the limit and offset values to the parameters array.
  queryParams.push(limit, (page - 1) * limit);

  // Run both queries concurrently.
  const [dataResult, countResult] = await Promise.all([
    pool.query(baseDataQuery, queryParams), // Use the full query with all params
    // For the count query only need the search param (if it exists)
    pool.query(baseCountQuery, search ? [`%${search}%`] : []),
  ]);

  // Extract and return the results.
  const variants = dataResult.rows;
  const totalCount = parseInt(countResult.rows[0].count, 10);

  return {
    variants,
    totalCount,
  };
};

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