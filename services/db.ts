import * as SQLite from 'expo-sqlite';

/**
 * Equilibrium Finance SQLite Service
 * Demonstrates local database management for financial records.
 */

const DB_NAME = 'equilibrium.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let isInitialized = false;

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const initDB = async (retries = 3) => {
  if (dbInstance && isInitialized) return dbInstance;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (!dbInstance) {
        dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
      }

      if (!isInitialized) {
        // Keep initialization conservative for Android release builds.
        try {
          await dbInstance.runAsync('PRAGMA journal_mode = WAL;');
          await dbInstance.runAsync('PRAGMA foreign_keys = ON;');
        } catch (e) {
          console.warn('[DB] Non-critical PRAGMA failed:', e);
        }

        // Create tables individually for better compatibility
        await dbInstance.execAsync(`
          CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY NOT NULL,
            amount REAL NOT NULL,
            type TEXT NOT NULL,
            category TEXT NOT NULL,
            date TEXT NOT NULL,
            note TEXT
          );
        `);
        
        await dbInstance.execAsync(`
          CREATE TABLE IF NOT EXISTS goals (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            target_amount REAL NOT NULL,
            current_amount REAL NOT NULL,
            icon TEXT,
            category TEXT
          );
        `);


        // Migrations
        const existingTableInfo: any[] = await dbInstance.getAllAsync("PRAGMA table_info(goals)");
        const columnNames = existingTableInfo.map(col => col.name);

        if (!columnNames.includes('icon')) {
          try { await dbInstance.execAsync('ALTER TABLE goals ADD COLUMN icon TEXT;'); } catch (e) { console.warn('[DB] Could not add icon:', e); }
        }
        if (!columnNames.includes('category')) {
          try { await dbInstance.execAsync('ALTER TABLE goals ADD COLUMN category TEXT;'); } catch (e) { console.warn('[DB] Could not add category:', e); }
        }

        isInitialized = true;
        console.log(`[DB] Database ready after ${attempt} attempt(s)`);
      }

      return dbInstance;
    } catch (error) {
      console.error(`[DB] Initialization attempt ${attempt} failed:`, error);
      dbInstance = null;
      if (attempt === retries) throw error;
      await delay(500); // Wait before next attempt
    }
  }
  
  throw new Error('Database initialization failed after multiple attempts');
};





// CRUD helpers
export const addItemDB = async (db: SQLite.SQLiteDatabase, table: 'transactions' | 'goals', item: any) => {
  const keys = Object.keys(item);
  const placeholders = keys.map(() => '?').join(', ');
  const values = Object.values(item);
  const sql = `INSERT OR REPLACE INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
  return await db.runAsync(sql, ...values as any);
};

export const deleteItemDB = async (db: SQLite.SQLiteDatabase, table: 'transactions' | 'goals', id: string) => {
  return await db.runAsync(`DELETE FROM ${table} WHERE id = ?`, id);
};

export const getAllItemsDB = async (db: SQLite.SQLiteDatabase, table: 'transactions' | 'goals') => {
  return await db.getAllAsync(`SELECT * FROM ${table} ORDER BY ${table === 'transactions' ? 'date DESC' : 'id ASC'}`);
};

export const updateItemDB = async (db: SQLite.SQLiteDatabase, table: 'transactions' | 'goals', id: string, updates: any) => {
  if (!id) {
    console.warn(`[updateItemDB] Missing ID for table ${table}`);
    return;
  }
  
  const keys = Object.keys(updates);
  if (keys.length === 0) return;

  const setClause = keys.map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(updates), id];
  
  // Defensive check for any null/undefined values that might crash native bridge
  const cleanValues = values.map(v => v === undefined ? null : v);
  
  const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
  return await db.runAsync(sql, ...cleanValues as any);
};
