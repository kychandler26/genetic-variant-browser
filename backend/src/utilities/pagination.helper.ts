
import { ParsedQs } from 'qs';

interface IPagination {
    page: number;
    limit: number;
}

const MAX_LIMIT = 100; // Maximum limit for pagination to prevent excessive load
const DEFAULT_LIMIT = 25; // Default limit if not specified

/**
 * Parses, validates and sanitizes pagination parameters from the request query.
 * @param query - The request query object from Express.
 * @returns A validated pagination object with page and limit.
 */


// Passing in the ParsedQs type from 'qs' allows for more flexible query parsing
export const parsePagination = (query: ParsedQs): IPagination => {
    let page = parseInt(query.page as string, 10) || 1; // Default to page 1 if not provided
    
    let limit = parseInt(query.limit as string || DEFAULT_LIMIT.toString(), 10);

    // validate and sanitize the page and limit values
    if (isNaN(page) || page < 1) {
        page = 1; // Reset to page 1 if invalid
    }
    if (isNaN(limit) || limit < 1) {
        limit = DEFAULT_LIMIT; // Reset to default limit of 25 if limit is invalid
    }

    limit = Math.min(limit, MAX_LIMIT); // Cap the limit to a maximum of 100 to prevent excessive load attacks

    return {page, limit};
}