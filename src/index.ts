import express from "express";
import { getEnv } from "./utils.js";
import cors from "cors";
import { DB } from "./db.js";
import { getBlockRootsTree } from "./block_roots.js";

const PORT = getEnv("PORT")
const SQLITE_DB = getEnv("SQLITE_DB")

const app = express()
app.use(cors())

const db = new DB(SQLITE_DB);

app.get('/block_summary', async (req: express.Request, res: express.Response) => {
    let period = Number(req.query.period);
    if (Number.isNaN(period)) {
        return res.status(400).json({
            code: 400,
            message: `Provide a valid period query param`
        })
    }

    try {
        let blockRoots = await getBlockRootsTree(db, period)
        if (!blockRoots) {
            return res.status(404).json({
                code: 404,
                message: `Block roots tree not found for period: ${period}`
            })
        }

        return res.status(200).json({
            code: 200,
            data: blockRoots
        })
    }
    catch (e) {
        console.error(e)
        res.status(500).json({
            code: 500,
            message: "Something went horribly wrong"
        })
    }

});

app.listen(PORT, async () => {
    await db.connect()
	console.log(`Magic is happening at http://localhost:${PORT}`)
})
