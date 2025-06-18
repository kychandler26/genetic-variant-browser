// Import the required modules

import express from 'express';
import cors from 'cors';

// Import the variant routes
import variantRoutes from './routes/variant.routes.js';

const app = express();

// Tell the app to use CORS and JSON middleware
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Welcome to the Genetic Variant Browser API');
});

app.use('/api/variants', variantRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
})