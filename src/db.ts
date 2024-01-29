import { AsyncDatabase } from "promised-sqlite3"

export class DB {
    db: AsyncDatabase
    constructor(private dbPath: string) {}

    public async connect() {
        this.db = await AsyncDatabase.open(this.dbPath);
    }

    public async insertBlockRoot(slot: number, root: string) {
        const sql = `INSERT OR REPLACE INTO roots (slot, block_root) VALUES (?, ?)`;
        await this.db.run(sql, [slot, root])
    }

    public async getBlockRoots(fromSlot: number, toSlot: number) {
        const sql = `SELECT * FROM roots WHERE slot >= ? AND slot < ? ORDER BY slot ASC`
        const res = await this.db.all(sql, [fromSlot, toSlot])
        return res as {slot: number, block_root: string}[]
    }

    public async getBlockRoot(slot: number) {
        const sql = `SELECT block_root FROM roots WHERE slot <= ? ORDER BY slot DESC LIMIT 1`
        const res: {block_root: string} = await this.db.get(sql, [slot]);
        return res.block_root
    }

    public async getFirstSlot() {
        const sql = `SELECT slot FROM roots ORDER BY slot ASC LIMIT 1`
        const res: {slot: number} = await this.db.get(sql);
        return res?.slot || 0
    }

    public async getLatestSlot() {
        const sql = `SELECT slot FROM roots ORDER BY slot DESC LIMIT 1`
        const res: {slot: number} = await this.db.get(sql);
        return res?.slot || 0
    }

    public async hasRange(min: number, max: number) {
        const sql = `SELECT
            CASE
                WHEN SUM(CASE WHEN slot < ? THEN 1 ELSE 0 END) > 0
                    AND SUM(CASE WHEN slot > ? THEN 1 ELSE 0 END) > 0
                THEN 1
                ELSE 0
            END AS range_exists
        FROM roots;`

        const res: { range_exists: 0 | 1 } = await this.db.get(sql, [min, max])
        return res.range_exists > 0
    }

    public async isInitialized() {
        const sql = `SELECT name FROM sqlite_master WHERE type='table'`;
        const res = await this.db.all(sql);
        return res.length > 0
    }
}
