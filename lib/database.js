const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false,
    max: 50,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
});

async function query(text, params) {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;

    if (process.env.NODE_ENV !== 'production') {
        console.log('executed query', { text, duration: duration + 'ms', rows: res.rowCount });
    }

    return res;
}

async function getClient() {
    const client = await pool.connect();
    return client;
}

// Fungsi grgr free tier woilah
async function runMigrations() {
    try {
        const filePath = path.join(__dirname, '..', 'migrations', '001_init.sql');
        const sql = fs.readFileSync(filePath, 'utf8');
        await pool.query(sql);
        console.log('✅ Database migrations executed');
    } catch (err) {
        console.error('❌ Error running migrations', err);
        throw err;
    }
}

module.exports = { query, getClient, pool, runMigrations };
