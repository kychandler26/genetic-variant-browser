-- This script creates the database schema for storing genetic variants from the ClinVar file.
-- Defines custom types to ensure data consistency
CREATE TYPE variant_type AS ENUM ('SNP', 'Deletion', 'Insertion', 'Duplication', 'Indel');
CREATE TYPE clinical_significance AS ENUM ('Pathogenic', 'Likely pathogenic', 'Benign', 'Likely benign', 'Uncertain significance');

-- The main table for storing genetic variants from the ClinVar file
CREATE TABLE variants (
    id SERIAL PRIMARY KEY,
    -- From the 'GeneSymbol' column
    gene_name VARCHAR(100) NOT NULL,
    -- From the 'RS# (dbSNP)' column
    variant_id VARCHAR(50) UNIQUE,
    -- From the 'Name' column, which describes the variant's position
    genomic_position VARCHAR(255),
    -- From the 'Type' column (we will map 'single nucleotide variant' to 'SNP')
    variant_type variant_type,
    -- From the 'ClinicalSignificance' column
    clinical_significance clinical_significance,
    -- From the 'PhenotypeList' column
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);