// This script extracts the genetic variant data from the variant_summary.txt file
// The data is then transformed into the required format for our PostgreSQL table
// Finally the data is loaded into a PostgreSQL database using the pg library.

// Import necessary libraries
import fs from 'fs';
import csv from 'fast-csv';
import dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';
import  { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });


// Helper function to map the raw variant type to clean ENUM types.
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
  return null; 
}

function mapClinicalSignificance(rawSignificance) {
  if (!rawSignificance) {
    return null; // Handle cases where the field is empty
  }
  
  const significance = rawSignificance.toLowerCase();

  if (significance.includes('likely pathogenic')) {
    return 'Likely pathogenic';
  }
  if (significance.includes('pathogenic')) {
    return 'Pathogenic';
  }
  if (significance.includes('likely benign')) {
    return 'Likely benign';
  }
  if (significance.includes('benign')) {
    return 'Benign';
  }
  if (significance.includes('uncertain')) {
    return 'Uncertain significance';
  }
  return null;
}

// Main function to extract, transform, and load the data
async function processAndLoadData() {
  let pool;
  let client;

  try {
    // Open the new Pool connection to the PostgreSQL database
    pool = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    });
    console.log('Connecting to the database...');
    client = await pool.connect();
    console.log('Connected to the database successfully.');

    await new Promise((resolve, reject) => {
      const filePath = path.join(__dirname, '..', '..', 'variant_summary.txt');
      const stream = fs.createReadStream(filePath);
      
      const csvStream = csv.parse({ headers: true, delimiter: '\t' });


      csvStream
        .on('error', (error) => {
          console.error('Error reading the file:', error);
          reject(error);
        })
        .on('data', async (row) => {
          csvStream.pause();
          try {
            if (!row.ClinicalSignificance || !row.GeneSymbol) {
              return;
            }
            const variantData = {
                gene_name: row.GeneSymbol.trim(),
                variant_id: row['RS# (dbSNP)'] || null,
                genomic_position: row.Name,
                variant_type: mapVariantType(row.Type), 
                clinical_significance: mapClinicalSignificance(row.ClinicalSignificance),
                details: row.PhenotypeList || 'No phenotype listed.'
            };
            if (!variantData.variant_type || !variantData.clinical_significance) {
              return;
            }
            const insertQuery = `
              INSERT INTO public.variants (gene_name, variant_id, genomic_position, variant_type, clinical_significance, details)
              VALUES ($1, $2, $3, $4, $5, $6)
              ON CONFLICT (variant_id) DO NOTHING;
            `;
            const values = [
              variantData.gene_name,
              variantData.variant_id,
              variantData.genomic_position,
              variantData.variant_type,
              variantData.clinical_significance,
              variantData.details,
            ];
            try {
              await client.query(insertQuery, values);
            } catch (insertError) {
              console.error('Error inserting row:', insertError);
            }
          } finally {
            csvStream.resume(); 
          }
        })
        .on('end', (rowCount) => {
          console.log(`Finished processing file. Parsed ${rowCount} rows.`);
          resolve();
        });

      stream.pipe(csvStream);
    });

    console.log('Data import completed successfully.');

  } catch (error) {
    console.error('An error occurred during the data import process:', error);
    return;
  } finally {
    if (client) {
      client.release();
      console.log('Database client released.');
    }
    if  (pool) {
      await pool.end();
      console.log('Database connection pool closed.');
    }
  }
};

processAndLoadData();