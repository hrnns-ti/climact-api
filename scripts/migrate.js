require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runMigrations() {
    try {
        const filePath = path.join(__dirname, '..', 'migrations', '001_init.sql');
        if (!fs.existsSync(filePath)) {
            console.error('❌ migrations/001_init.sql tidak ditemukan');
            process.exit(1);
        }

        const sql = fs.readFileSync(filePath, 'utf8');
        console.log('🚀 Running 001_init.sql ...');

        await pool.query(sql);

        console.log('✅ Migration selesai, schema siap dipakai');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigrations();
