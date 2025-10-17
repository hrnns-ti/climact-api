import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('climact.sqlite'); // or ':memory:' idk

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        password TEXT,
        points INTEGER
    );
    
    CREATE TABLE IF NOT EXISTS quest (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        category TEXT NOT NULL CHECK (category IN ('daily', 'weekly')),
        points INTEGER DEFAULT 0,
        created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deadline TIMESTAMP NOT NULL,
        target INTEGER NOT NULL DEFAULT 1
                                
    );

    CREATE TABLE IF NOT EXISTS user_quests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        quest_id INTEGER NOT NULL,
        progress INTEGER DEFAULT 0,
        completed BOOLEAN NOT NULL DEFAULT 0,
        started TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        finished TIMESTAMP,
        periode TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(quest_id) REFERENCES quest(id),
        UNIQUE (user_id, quest_id, periode)
    );

`);

export default db;
