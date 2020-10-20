import { AdapterInterface } from './adapter.interface.ts';

export type CacheContentType = string | Array<string | object | CacheContentType> | object

/**
 * This class takes an CacheAdapter and provides an interface for easy content-caching
 */
export class Cache {
    /**
     * Takes the Adapter for the cache instance
     *
     * @param adapter
     */
    constructor(private adapter: AdapterInterface) {}

    /**
     * Checks weather the requested cache key is set an valid (not expired)
     *
     * @param key
     */
    has(key: string): Promise<boolean> {
        return this.adapter.has(key)
    }

    /**
     * Returns the cached content or `null` if the cache key could not be found or has expired
     *
     * @param key
     */
    async get(key: string): Promise<CacheContentType | null> {
        const content = await this.adapter.get(key)
        if (content === null) {
            return null
        }

        return this.deserialize(content);
    }

    /**
     * Caches the content for the given time
     *
     * @param key
     * @param seconds
     * @param content
     */
    set(key: string, seconds: number, content: CacheContentType): Promise<void> {
        return this.adapter.set(
            key,
            seconds,
            this.serialize(content)
        )
    }

    /**
     * Caches the content without any expiration
     *
     * @param key
     * @param content
     */
    forever<T (key: string, content: <CacheContentType T "">): Promise<void> {
        return this.adapter.forever(key, this.serialize(content))
    }

    /**
     * Invalidate cache key
     *
     * @param key
     */
    forget(key: string): Promise<void> {
        return this.adapter.forget(key)
    }

    /**
     * Invalidate the whole cache
     */
    flush(): Promise<void> {
        return this.adapter.flush()
    }

    /**
     * Returns the cached content if it exists and it has not expired. Otherwise the callback gets called and its return value will be cached for the given seconds
     *
     * @param key
     * @param seconds
     * @param callback
     */
    async remember<T extends CacheContentType>(key: string, seconds: number, callback: () => Promise<T> | T): Promise<T> {
        if (await this.has(key)) {
            return <T> this.get(key)
        }
        const callbackReturn = await callback()
        await this.set(key, seconds, callbackReturn)

        return callbackReturn
    }

    /**
     * This function behaves exactly like the `remember`-function, but doesn't need the cache duration
     *
     * @param key
     * @param callback
     */
    async rememberForever(key: string, callback: Function): Promise<any> {
        if (await this.has(key)) {
            return this.get(key)
        }
        const callbackReturn = await callback()
        await this.forever(key, callbackReturn)

        return callbackReturn
    }

    /**
     * Serialize the given input to as string
     *
     * @param content
     */
    private serialize(content: CacheContentType): string {
        if (typeof content === 'string') {
            return content
        }

        return JSON.stringify(content)
    }

    /**
     * Deserialize the given input from a string to an array/object
     *
     * @param content
     */
    private deserialize(content: string): CacheContentType {
        try {
            return JSON.parse(content)
        } catch (e) {
            return content
        }
    }
}
