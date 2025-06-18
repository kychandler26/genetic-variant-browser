-- This script creates the database schema for storing genetic variants from the ClinVar file.
-- Defines custom types to ensure data consistency
CREATE TYPE variant_type AS ENUM ('SNP', 'Deletion', 'Insertion', 'Duplication', 'Indel');
CREATE TYPE clinical_significance AS ENUM ('Pathogenic', 'Likely pathogenic', 'Benign', 'Likely benign', 'Uncertain significance');

-- The main table for storing genetic variants from the ClinVar file
CREATE TABLE variants (
    id SERIAL PRIMARY KEY,
    -- From the 'GeneSymbol' column
    gene_name TEXT NOT NULL,
    -- From the 'RS# (dbSNP)' column, which can also be unexpectedly long
    variant_id TEXT UNIQUE,
    -- From the 'Name' column, which describes the variant's position
    genomic_position TEXT,
    -- From the 'Type' column
    variant_type variant_type,
    -- From the 'ClinicalSignificance' column
    clinical_significance clinical_significance,
    -- From the 'PhenotypeList' column
    details TEXT,
    -- Automatically records when a row was created
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE USER dataloader_user WITH PASSWORD 'password_here';

GRANT INSERT, SELECT ON TABLE variants TO dataloader_user;
GRANT USAGE ON SEQUENCE variants_id_seq TO dataloader_user;