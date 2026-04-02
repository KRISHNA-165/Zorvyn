import * as SQLite from 'expo-sqlite';

/**
 * Equilibrium Finance SQLite Service
 * Demonstrates local database management for financial records.
 */

const DB_NAME = 'equilibrium.db';

export const initDB = async () => {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      note TEXT
    );
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL NOT NULL,
      icon TEXT,
      category TEXT
    );
  `);
  
  console.log('Database initialized successfully');
  return db;
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
  const keys = Object.keys(updates);
  const setClause = keys.map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(updates), id];
  const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
  return await db.runAsync(sql, ...values as any);
};
