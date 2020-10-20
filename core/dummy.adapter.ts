import { AdapterInterface } from "./adapter.interface.ts";

/**
 * This dummy-adapter just implement the adapter intface and fakes a cache by returning always null for get-requests.
 * This adapter is useful for local development, so the cache is disabled unless the adapter will be replaces by a real one.
 */
export class DummyAdapter implements AdapterInterface {
    set(key: string, seconds: number, content: string): Promise<void> {
        return Promise.resolve()
    }

    forever(key: string, content: string): Promise<void> {
        return Promise.resolve()
    }

    has(key: string): Promise<boolean> {
        return Promise.resolve(false)
    }

    get(key: string): Promise<string | null> {
        return Promise.resolve(null)
    }

    forget(key: string): Promise<void> {
        return Promise.resolve()
    }

    flush(): Promise<void> {
        return Promise.resolve()
    }

}
