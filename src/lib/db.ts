import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Get database path from environment or default to local root
const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'expense.db');

// Ensure the directory exists (important for Docker volumes)
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Create the transactions table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    note TEXT,
    date TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export default db;
