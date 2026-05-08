import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import {
    KeyValueStorageOperations,
    KeyValueStoreRepository as RepositoryAbstraction,
    type IKeyValueStoreSetOptions
} from "./abstractions.js";
import { KeyNotFoundError, KeyValueStorageError } from "./errors.js";

/**
 * KeyValueStoreRepository implementation.
 *
 * This repository passes key and scope separately to storage operations.
 * The storage layer is responsible for handling scope-based partitioning.
 */
class KeyValueStoreRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private storageOperations: KeyValueStorageOperations.Interface) {}

    async get<T = unknown>(
        key: string,
        scope: string
    ): Promise<Result<T, RepositoryAbstraction.Error>> {
        try {
            const record = await this.storageOperations.get(key, scope);

            if (!record) {
                return Result.fail(new KeyNotFoundError(key));
            }

            return Result.ok(record.value as T);
        } catch (error) {
            return Result.fail(new KeyValueStorageError(error as Error));
        }
    }

    async set(
        key: string,
        value: any,
        scope: string,
        options?: IKeyValueStoreSetOptions
    ): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            await this.storageOperations.set(key, value, scope, options);
            return Result.ok();
        } catch (error) {
            return Result.fail(new KeyValueStorageError(error as Error));
        }
    }

    async delete(key: string, scope: string): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            await this.storageOperations.delete(key, scope);
            return Result.ok();
        } catch (error) {
            return Result.fail(new KeyValueStorageError(error as Error));
        }
    }
}

export const KeyValueStoreRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: KeyValueStoreRepositoryImpl,
    dependencies: [KeyValueStorageOperations]
});
