
export interface AdapterInterface {
    /**
     * Caches the content for the given time identified by the given key
     *
     * @param key
     * @param seconds
     * @param content
     */
    set(key: string, seconds: number, content: string): Promise<void>

    /**
     * Caches the content for the given key, without any expiration
     *
     * @param key
     * @param content
     */
    forever(key: string, content: string): Promise<void>

    /**
     * Checks if the requested cache key is set an valid (not expired)
     *
     * @param key
     */
    has(key: string): Promise<boolean>

    /**
     * Returns the cached content or `null` if the cache key could not be found or has expired
     *
     * @param key
     */
    get(key: string): Promise<string | null>

    /**
     * Invalidate cache key
     *
     * @param key
     */
    forget(key: string): Promise<void>

    /**
     * Invalidate the whole cache
     */
    flush(): Promise<void>
}
