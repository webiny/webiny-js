import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import {
    KeyValueStoreRepository,
    GlobalKeyValueStore as ServiceAbstraction,
    IGlobalKeyValueStoreOptions
} from "./abstractions.js";

const DEFAULT_SCOPE = "global";

class GlobalKeyValueStoreImpl implements ServiceAbstraction.Interface {
    constructor(private repository: KeyValueStoreRepository.Interface) {}

    private getScope(options?: IGlobalKeyValueStoreOptions): string {
        return options?.scope || DEFAULT_SCOPE;
    }

    async get<T = unknown>(
        key: string,
        options?: IGlobalKeyValueStoreOptions
    ): Promise<Result<T, ServiceAbstraction.Error>> {
        const scope = this.getScope(options);
        return this.repository.get<T>(key, scope);
    }

    async set(
        key: string,
        value: any,
        options?: IGlobalKeyValueStoreOptions
    ): Promise<Result<void, ServiceAbstraction.Error>> {
        const scope = this.getScope(options);
        return this.repository.set(key, value, scope);
    }

    async delete(
        key: string,
        options?: IGlobalKeyValueStoreOptions
    ): Promise<Result<void, ServiceAbstraction.Error>> {
        const scope = this.getScope(options);
        return this.repository.delete(key, scope);
    }

    async list(
        keyPrefix: string,
        options?: IGlobalKeyValueStoreOptions
    ): Promise<Result<ServiceAbstraction.KeyValueRecord[], ServiceAbstraction.Error>> {
        const scope = this.getScope(options);
        return this.repository.listByPrefix(keyPrefix, scope);
    }
}

export const GlobalKeyValueStore = createImplementation({
    abstraction: ServiceAbstraction,
    implementation: GlobalKeyValueStoreImpl,
    dependencies: [KeyValueStoreRepository]
});
