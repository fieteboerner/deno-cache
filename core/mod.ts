import { Cache } from './cache.ts'
import { AdapterInterface } from './adapter.interface.ts'
import { DummyAdapter } from "./dummy.adapter.ts"

export type { Cache, CacheContentType } from './cache.ts'
export type { AdapterInterface } from './adapter.interface.ts'

export function createCache(adapter: AdapterInterface): Cache {
    return new Cache(adapter)
}

export function createDummyAdapter(): DummyAdapter {
    return new DummyAdapter()
}

