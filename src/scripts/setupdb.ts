import { AsyncDatabase } from "promised-sqlite3"
import { getEnv } from "../utils.js";

const SQLITE_DB = getEnv("SQLITE_DB")

export const migrate = async () => {
    const schema = `
        CREATE TABLE IF NOT EXISTS roots (
            slot INTEGER PRIMARY KEY,
            block_root CHAR(64) NOT NULL
        )
    `
    const db = await AsyncDatabase.open(SQLITE_DB);
    await db.run(schema)
    console.log("[MIGRATE] Set up database properly")
}