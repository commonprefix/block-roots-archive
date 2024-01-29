import { allForks, phase0, ssz } from "@lodestar/types"
import * as deneb from "@lodestar/types/deneb"
import { Api, ApiClientErrorResponse, HttpStatusCode, getClient } from "@lodestar/api";
import { toHexString } from '@chainsafe/ssz'
import { config } from "@lodestar/config/default";
import { LodestarError } from "./errors.js";
import { block, state } from "@lodestar/api/lib/beacon/routes/beacon/index.js";
import { sleep } from "./utils.js";

export class EthAPI {
    private consensus: Api

    constructor(beaconURL: string) {
        this.consensus = getClient({ baseUrl: beaconURL }, {config})
    }

    async getBlockRoot(blockId: string | number): Promise<string | null> {
        const fn = this.consensus.beacon.getBlockRoot
        const res = await this.retry(fn, [blockId], 4);
        if (res.error) {
            if (res.error.code == 404) {
                return null
            }
            throw new LodestarError(res.error)
        }

        return toHexString(res.response.data.root);
    }

    async getHeadSlot(): Promise<number> {
        const fn = this.consensus.beacon.getBlockHeader;
        const res = await this.retry(fn, ['head'], 4);
        if (res.error) {
            throw new LodestarError(res.error)
        }

        return res ? res.response.data.header.message.slot : null
    }

    async getState(stateId: string): Promise<deneb.BeaconState> {
        const res = await this.consensus.debug.getStateV2(stateId);
        if (res.error) {
            console.error(res.error)
            throw new Error("Error fetching state")
        }
 
        return res.response.data as deneb.BeaconState
    }

    async retry(request: Function, args: any[], times: number): Promise<any> {
        let count = 0
        let res: any
        while (count <= times) {
            res = await request(...args)
            if (!res.error || res.error && res.error.code == 404) {
                return res
            }
            else {
                console.error("[ETH] Error occured. Will sleep 10 secs and retry", res.error)
                await sleep(1000 * 10)
                count++
            }
        }

        return res
    }
}