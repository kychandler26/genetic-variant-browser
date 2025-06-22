// Import the Router object from express
import { Router } from "express";

// import the controller functions for handling variant-related requests from '../controllers/variant.controller'
import {getVariants, getVariantById, getVariantSummary} from "../controllers/variant.controller.js";

// Create a new router instance / mini application
const router = Router();

// Define the routes for the API

// Route to get all variants (with potential filtering, searching, and pagination)
// GET /api/variants
router.get("/", getVariants);

// Route to get aggregated summary data for the dashboard
// GET /api/variants/summary
router.get('/summary', getVariantSummary);

// Route to get a specific variant by ID
// GET /api/variants/:id
router.get("/:id", getVariantById);


// Export the router so it can be used by the main server file
export default router;