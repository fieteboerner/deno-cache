import { sha256, exists, ensureDirSync, emptyDir, AdapterInterface } from './deps.ts'

export interface DenoFsAdapterConfig {
    cacheDir: string
}

/**
 * This adapter uses the file system of the execution environment to persist and restore the cache.
 * Each the content for each cache key will be stored in a separate file.
 */
export class DenoFsAdapter implements AdapterInterface {
    /**
     * Maximal Timestamp (10 digits)
     * This is important because we expect exactly ten digits to differentiate the expiration timestamp from the cache content
     *
     * @see get
     */
    private MAX_TS = 9999999999

    /**
     * Takes the configuration options to work and ensures that the cache directory exists
     * @param config
     */
    constructor(private config: DenoFsAdapterConfig) {
        ensureDirSync(config.cacheDir)
    }

    forever(key: string, content: string): Promise<void> {
        return this.set(key, 0, content)
    }

    /**
     * clears the whole cache directory
     */
    flush(): Promise<void> {
        return emptyDir(this.config.cacheDir)
    }

    /**
     * Saves the cache content and the expiration timestamp into a cache file
     *
     * @param key
     * @param seconds
     * @param content
     */
    set(key: string, seconds: number, content: string): Promise<void> {
        const encoder = new TextEncoder()
        const expirationTimestamp = this.getExpirationTimestamp(seconds)
        const fileContent = `${expirationTimestamp}${content}`

        return Deno.writeFile(this.getCacheFilePath(key), encoder.encode(fileContent))
    }

    /**
     * Checks if a cache file exists for the requested key. If so, the the expiration timestamp will be checked if the cached value is still valid.
     * If that is the case, the cached value will be returned. In all other (negative) cases `null` will be returned
     *
     * @param key
     */
    async get(key: string): Promise<string | null> {
        const filePath = this.getCacheFilePath(key)

        if (!await exists(filePath)) {
            return null
        }

        const fileContent = await Deno.readFile(filePath)
        const decoder = new TextDecoder('utf-8')
        const rawContent = decoder.decode(fileContent)
        const expirationTimestamp = parseInt(rawContent.substr(0, 10), 10)

        if (expirationTimestamp < this.getCurrentTimestamp()) {
            this.forget(key)
            return null
        }

        return rawContent.substring(10, rawContent.length)
    }

    /**
     * removes one cache file
     *
     * @param key
     */
    forget(key: string): Promise<void> {
        return Deno.remove(this.getCacheFilePath(key))
    }

    /**
     * Checks if cache content exists and if it is still valid.
     * For this, we check if the get-method returns `null`or not, because we have to read the file anyway to check its expiration timestamp
     *
     * @param key
     */
    async has(key: string): Promise<boolean> {
        const content = await this.get(key)
        return content !== null
    }

    /**
     * Returns the current Unix-Timestamp (in seconds)
     */
    private getCurrentTimestamp(): number {
        const now = new Date()
        return Math.round(now.getTime() / 1000)
    }

    /**
     * convert the cache-key in a file name by using the sha256 algorithm.
     *
     * @param key
     */
    private getCacheFilePath(key: string): string {
        const hash = sha256(key, 'utf8', 'hex')
        return this.config.cacheDir + '/' + hash + '.cache'
    }

    /**
     * generates a Unix-Timestamp for the expiration time. (ts now * seconds).
     * It also ensures that the timestamp is not longer than ten digits because of the mentioned reasons at `MAX_TS`.
     * One exception is the 0-second parameter. If the seconds are 0 it returns the highest possible timestamp fot the "forever-case"
     *
     * @param seconds
     */
    private getExpirationTimestamp(seconds: number): number {
        if (seconds === 0) {
            return this.MAX_TS
        }
        return Math.min(this.getCurrentTimestamp() + seconds, this.MAX_TS)
    }
}
