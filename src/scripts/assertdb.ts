import { DB } from "../db.js"
import { EthAPI } from "../eth.js"
import { writeFileSync, readFileSync } from "fs"
import { getEnv } from "../utils.js"
import { toHexString, fromHexString, VectorCompositeType, ByteVectorType } from '@chainsafe/ssz'

const SQLITE_DB = getEnv("SQLITE_DB")
const BEACON_API = getEnv("BEACON_API")

const db = new DB(SQLITE_DB)
const eth = new EthAPI(BEACON_API)

const byteVectorType = new ByteVectorType(32);
const vectorType = new VectorCompositeType(byteVectorType, 8192);

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

const getBlockRootsTree = async (period: number) => {
    const startSlot = getStartSlotOfPeriod(period)
    const hasRange = await db.hasRange(startSlot, startSlot + 8192);
    if (!hasRange) {
        console.log("Range for period does not exist in db", period)
    }

    const blockRoots = await db.getBlockRoots(startSlot, startSlot + 8192);
    const blockRootsMap: {[slot: number]: Uint8Array} = {}
    for (const {slot, block_root} of blockRoots) {
        blockRootsMap[slot] = fromHexString(block_root)
    }

    const rootsParsed = []
	for (let i = startSlot; i < startSlot + 8192; ++i) {
		const root: Uint8Array = blockRootsMap[i] ? 
			byteVectorType.serialize((blockRootsMap[i])) :
			rootsParsed[rootsParsed.length - 1];

		rootsParsed.push(root);
	}

    return rootsParsed
}

const main = async () => {
    const latestPeriodOfSummaries = 912
    const summariesFile = readFileSync(`./src/scripts/summaries_${latestPeriodOfSummaries}.json`).toString()
    const summaries = JSON.parse(summariesFile)

    const period = 912

    await db.connect()

    for (let i = period; i > 0; i--) {
        const startSlot = getStartSlotOfPeriod(i)
        console.log("start slot ", startSlot)
        const hasRange = await db.hasRange(startSlot, startSlot + 8192);
        if (!hasRange) {
            console.log("Range for period does not exist in db. Stopping", i)
            break;
        }
        else {
            console.log("Range in db", i)
        }

        const blockRootsTree = await getBlockRootsTree(i)
        const latestSummary = summaries.pop().blockSummaryRoot;

        console.log(`Latest summary: ${latestSummary}`)
        console.log(`Calculated summary: ${toHexString(vectorType.hashTreeRoot(blockRootsTree))}`)
    }
}

// const main2 = async () => {
//     await db.connect()
//     const startSlot = getStartSlotOfPeriod(912)
//     const rs =await db.newB(startSlot, startSlot + 8192)
//     console.log(rs)
// }

// downloadLatestSummaries().catch(console.error)
main()
    .catch(console.error)