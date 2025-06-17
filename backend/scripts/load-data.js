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


