import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { KeyValueStoreRepository } from "./abstractions.js";
import { GlobalKeyValueStore as ServiceAbstraction } from "./abstractions.js";
import type { IGlobalKeyValueStoreOptions } from "./abstractions.js";
import type { IGlobalKeyValueSetOptions } from "./abstractions.js";
import type { IGlobalKeyValueListParams } from "./abstractions.js";
import type { IGlobalKeyValueDeleteOptions } from "./abstractions.js";

const DEFAULT_SCOPE = "global";

class GlobalKeyValueStoreImpl implements ServiceAbstraction.Interface {
    constructor(private repository: KeyValueStoreRepository.Interface) {}

    private getScope(options?: { scope?: string }): string {
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
        options?: IGlobalKeyValueSetOptions
    ): Promise<Result<void, ServiceAbstraction.Error>> {
        const scope = this.getScope(options);
        return this.repository.set(key, value, scope, {
            expiresAt: options?.expiresAt,
            collection: options?.collection,
            ifAbsent: options?.ifAbsent,
            ifValue: options?.ifValue
        });
    }

    async delete(
        key: string,
        options?: IGlobalKeyValueDeleteOptions
    ): Promise<Result<void, ServiceAbstraction.Error>> {
        const scope = this.getScope(options);
        return this.repository.delete(key, scope, { ifValue: options?.ifValue });
    }

    async list<T = unknown>(
        params: IGlobalKeyValueListParams
    ): Promise<Result<ServiceAbstraction.ListResult<T>, ServiceAbstraction.Error>> {
        const { scope, ...listParams } = params;
        return this.repository.list<T>(this.getScope({ scope }), listParams);
    }
}

export const GlobalKeyValueStore = createImplementation({
    abstraction: ServiceAbstraction,
    implementation: GlobalKeyValueStoreImpl,
    dependencies: [KeyValueStoreRepository]
});
