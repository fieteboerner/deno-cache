import { DenoFsAdapter, DenoFsAdapterConfig } from './adapter.ts'

export type { DenoFsAdapterConfig, DenoFsAdapter } from './adapter.ts'

export function createDenoFsAdapter(config: DenoFsAdapterConfig): DenoFsAdapter {
    return new DenoFsAdapter(config)
}
