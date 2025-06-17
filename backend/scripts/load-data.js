// This script extracts the genetic variant data from the variant_summary.txt file
// The data is then transformed into the required format for our PostgreSQL table
// Finally the data is loaded into a PostgreSQL database using the pg library.


// Import the pg library to connect to PostgreSQL and get the client module from it
// Import the fs module to read the variant_summary.txt file
// Import the csv-parse library to parse the CSV data from the file
// Import dotenv to load environment variables from a .env file
// Import path to handle file paths in a cross-platform way
import fs from 'fs';
import csv from 'fast-csv';
import dotenv from 'dotenv';
import path, { delimiter } from 'path';
import { Pool } from 'pg';
import  { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });


// Helper function to map the raw variant type from the file to our clean ENUM types.
function mapVariantType(rawType) {
  const type = rawType.toLowerCase(); // Convert to lowercase for easier matching

  if (type.includes('single nucleotide variant')) {
    return 'SNP';
  }
  if (type.includes('deletion')) {
    return 'Deletion';
  }
  if (type.includes('insertion')) {
    return 'Insertion';
  }
  if (type.includes('duplication')) {
    return 'Duplication';
  }
  if (type.includes('indel')) {
    return 'Indel';
  }

  // If it's a type we don't care about (e.g., 'Microsatellite'), return null.
  return null; 
}


// Main function to extract, transform, and load the data
async function processAndLoadData() {
  let pool;
  let client;

  try {

    // Open the new Pool connection to the PostgreSQL database
    const pool = new Pool({
      // Use environment variables for database connection details
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: 'postgres',
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    });
    console.log('Connecting to the database...');
    // Connect to the PostgreSQL database
    client = await pool.connect();
    console.log('Connected to the database successfully.');

    // Create the read stream for the variant_summary.txt file
    fs.createReadStream('../variant_summary.txt')
    .pipe(csv.parse({ headers: true, delimiter: '\t' })) // Use tab as the delimiter for the .txt file
    .on('error', (error) => {
      console.error('Error reading the file:', error);
    })
    .on('data', async (row) => {
      // Log the row to the console for debugging
      console.log('Processing row:', row);
      
      //Add a check at the beginning of your .on('data',...) handler to return (skip) the row if 
      // row.ClinicalSignificance or row.GeneSymbol is missing or not provided.
      if (!row.ClinicalSignificance || !row.GeneSymbol) {
        console.log('Skipping row due to missing ClinicalSignificance or GeneSymbol:', row);
        return; // Skip this row  
      }

      //Create a new, clean object that will hold only the data destined for your database. 
      //Pull the values from the row object, which has keys directly from the file's header.
      //Remember that if a column name has special characters like # or (, you must use bracket
      // notation to access it (e.g., row['RS# (dbSNP)']).
      const variantData = {
          gene_name: row.GeneSymbol.trim(),
          variant_id: row['RS# (dbSNP)'] || null, // Use null if the ID is missing
          genomic_position: row.Name,
          
          // Clean the 'Type' column. We'll use a helper function for this to keep the code clean.
          variant_type: mapVariantType(row.Type), 
          
          // Clean the 'ClinicalSignificance' column. .trim() removes extra whitespace.
          clinical_significance: row.ClinicalSignificance.trim(),
          details: row.PhenotypeList || 'No phenotype listed.'
      
      }

      if (!variantData.variant_type) {
        return; // Skip rows with unmapped or unwanted variant types
        }

      console.log(variantData);

    })
    .on('end', async (rowCount) => {
      console.log('Finished processing the file.');
      console.log(`Total rows processed: ${rowCount} rows`);
      // Here you can add code to insert the processed data into the database
      // For example, you can use client.query() to execute SQL INSERT statements
    })

  } catch (error) {
    console.error('Error connecting to the database:', error);
    return;
  } finally {
    if (client) {
      // Ensure the client is released back to the pool
      client.release();
      console.log('Database client released.');
    }
    if  (pool) {
      // Ensure the pool is closed to free up resources
      await pool.end();
      console.log('Database connection pool closed.');
    }
  }
};


processAndLoadData();




// Goal: Parse the .txt file successfully

// Pipe the stream to the csv parser

// Add the .on('data', (row) => { ... }) listener.

// Inside the listener, for now, just do one thing: console.log(row).


