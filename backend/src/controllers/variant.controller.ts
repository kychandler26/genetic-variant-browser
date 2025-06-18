import { Request, Response } from "express";

// Create the service layer in a future step
import * as variantService from "../services/variant.service.js";

/**
 * Handles the request to get paginated, filtered and searched list of variants.
 * @param req - The request object containing query parameters for pagination, filtering, and searching.
 * @param res - The response object to send the results back to the client.
 */

export const getVariants = async (req: Request, res: Response) => {
    try {
        // Read in the query parameters from the request URL
        const pageStr = req.query.page as string | undefined; // Page number for pagination
        const limitStr = req.query.limit as string | undefined; // Number of items per page

        // Set the default value for the pagination parameters for case when they are not provided
        // In case when params are provided, parse them into numbers.
        const page = parseInt(pageStr || '1', 10);
        const limit = parseInt(limitStr || '25', 10);

        // Call the service function with the page and limit parameters
        // This function will handle the database query and return the results
        const result = await variantService.getAllVariants(page, limit);

        // Send a structured response back to the client, including pagination details
        res.status(200).json({
            message: 'Variants fetched successfully',
            data: result.variants,
            pagination: {
                currentPage: page,
                limit: limit,
                totalItems: result.totalCount,
                totalPages: Math.ceil(result.totalCount / limit),
            },
        });
    } catch (error) {
        console.error('ERROR in getVariants controller:', error);
        res.status(500).json({ message: 'Error fetching variants', error });
    }
}

/**
 * Handles the request to get a specific variant by its ID.
 * @param req - The request object containing the variant ID in the URL parameters.
 * @param res - The response object to send the variant data back to the client.
 */

export const getVariantById = async (req: Request, res: Response) => {
    try {
        const {id} = req.params; // get the ID from the url parameters
        // TODO: Call variant service to fetch the variant by ID from the database
        res.status(200).json({
            message: `Placeholder: Will return variant with ID ${id}`,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching variant by ID', error });
    }
};

/**
 * Handles the request to get aggregated summary data for the dashboard.
 * @param req - The request object.
 * @param res - The response object to send the summary data back to the client.
 */

export const getVariantSummary = async (req: Request, res: Response) => {
    try {
        //TODO: Call variant service to fetch aggregated data from the database
        res.status(200).json({
            message: 'Placeholder: Will return aggregated summary data for the dashboard',
    });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching variant summary', error });
    }
};