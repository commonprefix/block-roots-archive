import { AsyncDatabase } from "promised-sqlite3"

export const migrate = async () => {
    const schema = `
        CREATE TABLE IF NOT EXISTS roots (
            slot INTEGER PRIMARY KEY,
            block_root CHAR(64) NOT NULL
        )
    `
    const db = await AsyncDatabase.open("./db.sqlite");
    await db.run(schema)
    console.log("[MIGRATE] Set up database properly")
}