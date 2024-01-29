import { getStartSlotOfPeriod } from "./utils.js";
import { DB } from "./db.js";

export const getBlockRootsTree = async (db: DB, period: number): Promise<string[] | null> => {
    const startSlot = getStartSlotOfPeriod(period)
    const hasRange = await db.hasRange(startSlot, startSlot + 8192);
    if (!hasRange) {
        console.log("Range for period does not exist in db", period)
        return null
    }

    const blockRoots = await db.getBlockRoots(startSlot, startSlot + 8192);
    const blockRootsMap: { [slot: number]: string } = {}
    for (const {slot, block_root} of blockRoots) {
        blockRootsMap[slot] = block_root
    }

    if (!(startSlot in blockRootsMap)) {
        blockRootsMap[startSlot] = await db.getBlockRoot(startSlot)
    }

    const roots = []
	for (let i = startSlot; i < startSlot + 8192; ++i) {
		const root: string = blockRootsMap[i] ? blockRootsMap[i] : roots[roots.length - 1]
		roots.push(root);
	}

    return roots
}
