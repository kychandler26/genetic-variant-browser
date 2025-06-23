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
 * @param significance Optional clinical significance to filter by
 * @param type Optional variant type to filter by
 */

export const getAllVariants = async (
  page: number,
  limit: number,
  search?: string,
  type?: string,
  significance?: string
): Promise<IVariantsResponse> => {
  // Initialise the query building arrays
  const whereConditions: string[] = [];
  const queryParams: any[] = [];

  // Build the WHERE clause dynamically based on provided filters.
  if (search) {
    // Dynamically get the next parameter index (e.g., $1)
    const paramIndex = queryParams.length + 1;
    whereConditions.push(`(gene_name ILIKE $${paramIndex} OR variant_id ILIKE $${paramIndex})`);
    queryParams.push(`%${search}%`);
  }

  if (type) {
    // Dynamically get the next parameter index
    const paramIndex = queryParams.length + 1;
    whereConditions.push(`variant_type = $${paramIndex}`);
    queryParams.push(type);
  }

  if (significance) {
    // Dynamically get the next parameter index
    const paramIndex = queryParams.length + 1;
    whereConditions.push(`clinical_significance = $${paramIndex}`);
    queryParams.push(significance);
  }

  // Construct the final WHERE clause string
  // Check if 'whereConditions' has more than 0 items held within it, if it does have
  // more than 0 create a string with the word 'WHERE' then take every item in the whereConditions list
  // and join them together into a single string, putting the word " AND " between each condition.
  // Store the complete condition (e.g. "WHERE condition1 AND condition 2") in a variable called whereClause
  // ELSE if the list is empty store an empty string
  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Construct the full data and count queries
  const dataQuery = `SELECT * FROM variants ${whereClause} ORDER BY id LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
  const countQuery = `SELECT COUNT(*) FROM variants ${whereClause}`;

  // Create the final parameter arrays for each query
  const dataQueryParams = [...queryParams, limit, (page - 1) * limit];
  // The count query only needs the filter / search params, not limit / offset
  const countQueryParams = [...queryParams];

  // Run both queries concurrently
  const [dataResult, countResult] = await Promise.all([
    pool.query(dataQuery, dataQueryParams),
    pool.query(countQuery, countQueryParams),
  ]);

  //Extract and return the results
  const variants = dataResult.rows;
  const totalCount = parseInt(countResult.rows[0].count, 10);

  return {
    variants,
    totalCount
  };
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
    return result.rows[0] ?? null;
}

/**
 * Fetches aggregated counts for variant types and clinical significances
 */
export const getVariantSummaryData = async (): Promise<ISummaryResponse> => {
    // Query to count variant grouped by clinical_significance
    const significanceQuery = `
    SELECT clinical_significance as name, COUNT(*) as value
    FROM variants
    WHERE clinical_significance IS NOT NULL
    GROUP BY clinical_significance
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