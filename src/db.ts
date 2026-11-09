import Database from "@tauri-apps/plugin-sql"

let dbInstance: Database | null = null

export async function getDatabase(): Promise<Database> {
  if (dbInstance) return dbInstance

  dbInstance = await Database.load("sqlite:lazyseal.db")

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
      reasoning TEXT
    );
  `)

  return dbInstance
}


export type DbChat = {
  id: string
  title: string
  created_at: number
}

export type DbMessage = {
  id: string
  chat_id: string
  role: "user" | "assistant"
  content: string
  reasoning?: string | null
}

export async function fetchChatsFromDb(): Promise<DbChat[]> {
  const db = await getDatabase()
  return await db.select<DbChat[]>("SELECT * FROM chats ORDER BY created_at DESC")
}

export async function createChatInDb(id: string, title: string): Promise<void> {
  const db = await getDatabase()
  await db.execute("INSERT INTO chats (id, title, created_at) VALUES ($1, $2, $3)", [
    id,
    title,
    Date.now(),
  ])
}

export async function deleteChatFromDb(id: string): Promise<void> {
  const db = await getDatabase()
  await db.execute("DELETE FROM messages WHERE chat_id = $1", [id])
  await db.execute("DELETE FROM chats WHERE id = $1", [id])
}

export async function fetchMessagesFromDb(chatId: string): Promise<DbMessage[]> {
  const db = await getDatabase()
  return await db.select<DbMessage[]>(
    "SELECT * FROM messages WHERE chat_id = $1",
    [chatId]
  )
}

export async function saveMessageToDb(
  id: string,
  chatId: string,
  role: string,
  content: string,
  reasoning?: string
): Promise<void> {
  const db = await getDatabase()
  await db.execute(
    "INSERT INTO messages (id, chat_id, role, content, reasoning) VALUES ($1, $2, $3, $4, $5)",
    [id, chatId, role, content, reasoning || null]
  )
}

export async function updateMessageContentInDb(id: string, content: string, reasoning?: string): Promise<void> {
  const db = await getDatabase()
  await db.execute("UPDATE messages SET content = $1, reasoning = $2 WHERE id = $3", [
    content,
    reasoning || null,
    id,
  ])
}

export async function updateChatTitleInDb(id: string, title: string): Promise<void> {
  const db = await getDatabase()
  await db.execute("UPDATE chats SET title = $1 WHERE id = $2", [title, id])
}

export async function backupDatabaseViaSql(destinationPath: string): Promise<void> {
  const db = await getDatabase()
  const escapedPath = destinationPath.replace(/'/g, "''")
  await db.execute(`VACUUM INTO '${escapedPath}'`)
}
