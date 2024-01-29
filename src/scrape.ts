import { EthAPI } from './eth.js'
import { DB } from './db.js'
import { toHexString, fromHexString, VectorCompositeType, ByteVectorType } from '@chainsafe/ssz'
import { getEnv, sleep } from './utils.js'
import { migrate } from './scripts/setupdb.js'

const SQLITE_DB = getEnv("SQLITE_DB")
const BEACON_API = getEnv("BEACON_API")

const db = new DB(SQLITE_DB)
const eth = new EthAPI(BEACON_API)

const initialize = async () => {
	// Will not do anything if already migrated
	await migrate()

	let startSlot = await db.getLatestSlot();
	if (!startSlot) {
		console.log("[INITIALIZE] Database is empty. Will proceed with env START_SLOT")
		startSlot = +getEnv("START_SLOT", '0')

		try {
			const root = await eth.getBlockRoot(startSlot)
			if (!root) throw Error(`Could not fetch root: ${startSlot}`)
			await db.insertBlockRoot(startSlot, root);
		}
		catch (e) {
			console.error("[INITIALIZE] Initialize failed", e)
			process.exit()
		}

		console.log('[INITIALIZE] Initialized properly')
	}
	else {
		console.log(`[INITIALIZE] Latest slot in database ${startSlot}. Will continue from there`)
	}
}

const sync = async () => {
	let startSlot = await db.getLatestSlot()
	let headSlot = await eth.getHeadSlot()
	console.log(`[SYNC] Syncing from ${startSlot} up to ${headSlot}`)

	for (let i = startSlot + 1; i <= headSlot; ++i) {
		console.log("Processing", i)
		const root = await eth.getBlockRoot(i)
		if (root)  {
			await db.insertBlockRoot(i, root);
		}
		else {
			// console.warn("Root not found for slot", i)
		}
	}

	console.log("Syncing complete")
}

const backFill = async () => {
	await db.connect()
	let firstSlot = await db.getFirstSlot();

	for (let i = firstSlot; i > 0; --i ) {
		const root = await eth.getBlockRoot(i)
		if (root)  {
			await db.insertBlockRoot(i, root);
		}

		if (Number.isInteger(i / 32 / 256)) {
			console.log("Finished backfilling period", i / 32 / 256)
		}
	}
}

const main = async () => {
	await db.connect()
	await initialize()

	while (true) {
		try {
			await sync()
			await sleep(60 * 1000)
		}
		catch (e) {
			console.error("[SYNC] Syncing failed", e)
			process.exit();
		}
	}
}

// main()
backFill()
