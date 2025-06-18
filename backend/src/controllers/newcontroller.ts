// backend/src/controllers/variant.controller.ts

// ... (your imports and other functions are here)

export const getVariants = async (req: Request, res: Response) => {
  try {
    // 1. Get query parameters from the request URL. They will be strings.
    const pageStr = req.query.page as string | undefined;
    const limitStr = req.query.limit as string | undefined;

    // 2. Set default values if the parameters are not provided.
    //    Then, parse them into numbers.
    const page = parseInt(pageStr || '1', 10);
    const limit = parseInt(limitStr || '25', 10);

    // 3. Call the service function with the page and limit.
    const result = await VariantService.getAllVariants(page, limit);

    // 4. Send a structured response back to the client, including pagination details.
    //    This is crucial for the frontend to build its UI.
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
    res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

// ... (your getVariantById and getVariantSummary functions)