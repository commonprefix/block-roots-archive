import "dotenv/config"

export const getEnv = (key: string, defaultValue ?: string): string => {
    if (!process.env[key] && !defaultValue) {
        throw new Error(`Environment variable ${key} not set`)
    }

    // @ts-ignore
    return process.env[key] || defaultValue
}

export const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
} 

export const calcPeriodFromSlot = (slot: number) => Math.floor(slot / 32 / 256);
export const getStartSlotOfPeriod = (period: number) => period * 8192