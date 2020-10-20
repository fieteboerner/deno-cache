import { sha256, exists, ensureDirSync, emptyDir, AdapterInterface, CacheDuration, CacheKey } from './deps.ts'

export interface DenoFsAdapterConfig {
    cacheDir: string
}

export class DenoFsAdapter implements AdapterInterface {
    // Maximal Timestamp (10 digits)
    private MAX_TS = 9999999999

    constructor(private config: DenoFsAdapterConfig) {
        ensureDirSync(config.cacheDir)
    }

    forever(key: CacheKey, content: string): Promise<void> {
        return this.set(key, 0, content)
    }

    flush(): Promise<void> {
        return emptyDir(this.config.cacheDir)
    }

    set(key: CacheKey, seconds: CacheDuration, content: string): Promise<void> {
        const encoder = new TextEncoder()
        const expirationTimestamp = this.getExpirationTimestamp(seconds)
        const fileContent = `${expirationTimestamp}${content}`

        return Deno.writeFile(this.getCacheFilePath(key), encoder.encode(fileContent))
    }

    async get(key: CacheKey): Promise<string | null> {
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

    forget(key: CacheKey): Promise<void> {
        return Deno.remove(this.getCacheFilePath(key))
    }

    async has(key: CacheKey): Promise<boolean> {
        const content = await this.get(key)
        return content !== null
    }

    private getCurrentTimestamp(): number {
        const now = new Date()
        return Math.round(now.getTime() / 1000)
    }

    private getCacheFilePath(key: CacheKey): string {
        const hash = sha256(key, 'utf8', 'hex')
        return this.config.cacheDir + '/' + hash + '.cache'
    }


    private getExpirationTimestamp(seconds: number): number {
        if (seconds === 0) {
            return this.MAX_TS
        }
        return Math.min(this.getCurrentTimestamp() + seconds, this.MAX_TS)
    }
}
