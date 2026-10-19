import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { KeyValueStoreRepository } from "./abstractions.js";
import { GlobalKeyValueStore as ServiceAbstraction } from "./abstractions.js";
import type { IGlobalKeyValueStoreOptions } from "./abstractions.js";
import type { IGlobalKeyValueSetOptions } from "./abstractions.js";
import type { IGlobalKeyValueListParams } from "./abstractions.js";
import type { KeyValueComparable } from "./abstractions.js";

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
            collection: options?.collection
        });
    }

    async delete(
        key: string,
        options?: IGlobalKeyValueStoreOptions
    ): Promise<Result<void, ServiceAbstraction.Error>> {
        const scope = this.getScope(options);
        return this.repository.delete(key, scope);
    }

    async list<T = unknown>(
        params: IGlobalKeyValueListParams
    ): Promise<Result<ServiceAbstraction.ListResult<T>, ServiceAbstraction.Error>> {
        const { scope, ...listParams } = params;
        return this.repository.list<T>(this.getScope({ scope }), listParams);
    }

    async setIfAbsent(
        key: string,
        value: any,
        options?: IGlobalKeyValueStoreOptions
    ): Promise<Result<boolean, ServiceAbstraction.Error>> {
        const scope = this.getScope(options);
        return this.repository.setIfAbsent(key, value, scope, {
            expiresAt: options?.expiresAt
        });
    }

    async replaceIf(
        key: string,
        expected: KeyValueComparable,
        value: any,
        options?: IGlobalKeyValueStoreOptions
    ): Promise<Result<boolean, ServiceAbstraction.Error>> {
        const scope = this.getScope(options);
        return this.repository.replaceIf(key, expected, value, scope, {
            expiresAt: options?.expiresAt
        });
    }

    async deleteIf(
        key: string,
        expected: KeyValueComparable,
        options?: IGlobalKeyValueStoreOptions
    ): Promise<Result<boolean, ServiceAbstraction.Error>> {
        const scope = this.getScope(options);
        return this.repository.deleteIf(key, expected, scope);
    }
}

export const GlobalKeyValueStore = createImplementation({
    abstraction: ServiceAbstraction,
    implementation: GlobalKeyValueStoreImpl,
    dependencies: [KeyValueStoreRepository]
});
