import "dotenv/config"
import * as deneb from '@lodestar/types/deneb'

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