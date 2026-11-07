import Database from '@tauri-apps/plugin-sql'

let dbInstance: Database | null = null

export async function getDatabase(): Promise<Database> {
  if (dbInstance) return dbInstance
  
  dbInstance = await Database.load('sqlite:lazyseal.db')

  await dbInstance.execute(`
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
  `)

  await dbInstance.execute(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      reasoning TEXT,
      FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
    );
  `)

  return dbInstance
}