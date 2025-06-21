import { Request, Response } from "express";
import * as variantService from "../services/variant.service.js";
import { parsePagination } from "../utilities/pagination.helper.js";

/**
 * Handles the request to get paginated, filtered and searched list of variants.
 * @param req - The request object containing query parameters for pagination, filtering, and searching.
 * @param res - The response object to send the results back to the client.
 */

export const getVariants = async (req: Request, res: Response) => {
    try {
        // Use the parsePagination utility to extract and validate pagination parameters
        const { page, limit } = parsePagination(req.query);

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
        // Get the ID from the URL parameter (it will be a string)
        const id = parseInt(req.params.id, 10);

        // Validate the ID is a valid number (prevent case where user tries api/variants/abc)
        if (isNaN(id)) {
            res.status(400).json({message: 'Invalid variant ID.'});
            return;
        }

        // Call the service level to fetch the variant by its ID
        const variant = await variantService.getVariantById(id);

        // Check if the service found a variant
        if (variant) {
            // If found, send the variant data back to the client
            res.status(200).json({
                message: 'Variant fetched successfully',
                data: variant,
            });
        } else {
            // If the service returned null, send a 404 Not Found status
            res.status(404).json({ message: `Variant with ID ${id} not found.` });
        }
    } catch (error) {
        console.error('ERROR in getVariantById controller:', error);
        res.status(500).json({ message: 'Error fetching variant', error });
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