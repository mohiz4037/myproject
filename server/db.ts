
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";

const sqlite = new Database('db.sqlite');

// Enable foreign keys for SQLite
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
