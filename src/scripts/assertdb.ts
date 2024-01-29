import { DB } from "../db.js"
import { EthAPI } from "../eth.js"
import { writeFileSync, readFileSync } from "fs"
import { getEnv } from "../utils.js"
import { toHexString, fromHexString, VectorCompositeType, ByteVectorType } from '@chainsafe/ssz'
import { getBlockRootsTree } from "../block_roots.js"

const SQLITE_DB = getEnv("SQLITE_DB")
const BEACON_API = getEnv("BEACON_API")

const db = new DB(SQLITE_DB)
const eth = new EthAPI(BEACON_API)

const calcPeriodFromSlot = (slot: number) => Math.floor(slot / 32 / 256);
const getStartSlotOfPeriod = (period: number) => period * 8192

const downloadLatestSummaries = async ()  => {
    const state = await eth.getState('head')
    const historicalSummaries = state.historicalSummaries.map(s => {
        return {
            blockSummaryRoot: toHexString(s.blockSummaryRoot),
            stateSummaryRoot: toHexString(s.stateSummaryRoot)
        }
    })

    const latestPeriodOfSummaries = calcPeriodFromSlot(state.slot) - 1
    writeFileSync(`summaries_${latestPeriodOfSummaries}.json`, JSON.stringify(historicalSummaries))
}

const calcHashTreeRoot = (roots: string[]) => {
    const byteVectorType = new ByteVectorType(32);
    const vectorType = new VectorCompositeType(byteVectorType, 8192);

    const rootsVectors = roots.map(r => byteVectorType.serialize(fromHexString(r)));
    const hashTreeRoot = toHexString(vectorType.hashTreeRoot(rootsVectors))

    return hashTreeRoot
}

const main = async () => {
    const latestPeriodOfSummaries = 912
    const summariesFile = readFileSync(`./src/scripts/summaries_${latestPeriodOfSummaries}.json`).toString()
    const summaries = JSON.parse(summariesFile)

    const period = 912

    await db.connect()

    for (let i = period; i > 0; i--) {
        const startSlot = getStartSlotOfPeriod(i)
        const hasRange = await db.hasRange(startSlot, startSlot + 8192);
        if (!hasRange) {
            console.log("Range for period does not exist in db. Stopping", i)
            break;
        }
        else {
            console.log("Range in db", i)
        }

        const blockRootsTree = await getBlockRootsTree(db, i)
        const calculatedSummary = calcHashTreeRoot(blockRootsTree)
        const latestSummary = summaries.pop().blockSummaryRoot;
        
        console.log(`Period ${i} block roots validity: ${latestSummary == calculatedSummary}`)
    }
}

// downloadLatestSummaries().catch(console.error)
main()
    .catch(console.error)