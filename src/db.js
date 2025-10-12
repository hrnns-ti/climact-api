import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('climact.sqlite'); // or ':memory:' idk

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE,
    password TEXT
  );
`);

export default db;
