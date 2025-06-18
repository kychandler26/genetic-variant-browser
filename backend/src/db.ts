// The purpose of this module is to create a database connection pool using the `pg` library.
// This pool will be used throughout the application to interact with the PostgreSQL database.
// It reads the database connection details from environment variables using `dotenv`.
// This allows for easy configuration and avoids hardcoding sensitive information in the codebase.
// The pool instance is exported so it can be imported and used in other parts of the application
// to perform database operations like querying, inserting, updating, and deleting records.


import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({path: envPath}); // Load environment variables from .env file

const { Pool } = pg;

// Create a new pool instance with the database connection details
// This pool will be shared across the entire application
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT), // This logic will ensure the port is a number
});

export default pool;