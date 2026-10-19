import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import {
    KeyValueStorageOperations,
    KeyValueStoreRepository as RepositoryAbstraction,
    type IKeyValueListOptions,
    type IKeyValueListResult,
    type IKeyValueRecord,
    type IKeyValueStoreSetOptions
} from "./abstractions.js";
import { KeyNotFoundError, KeyValueStorageError, KeyValueInvalidCursorError } from "./errors.js";

const DEFAULT_LIST_LIMIT = 100;
const MAX_LIST_LIMIT = 1000;

const resolveLimit = (limit: number | undefined): number => {
    if (!limit || !Number.isFinite(limit)) {
        return DEFAULT_LIST_LIMIT;
    }
    return Math.min(Math.max(Math.floor(limit), 1), MAX_LIST_LIMIT);
};

/*
 * The cursor is the key the previous page stopped at. Encoded so callers treat it as opaque and do
 * not build one by hand, which leaves room to change what it carries.
 */
const encodeCursor = (key: string): string => {
    return Buffer.from(JSON.stringify({ after: key })).toString("base64url");
};

const decodeCursor = (cursor: string): string | undefined => {
    try {
        const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
        return typeof parsed?.after === "string" ? parsed.after : undefined;
    } catch {
        return undefined;
    }
};

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

    async list<T = unknown>(
        prefix: string,
        scope: string,
        options?: IKeyValueListOptions
    ): Promise<Result<IKeyValueListResult<T>, RepositoryAbstraction.Error>> {
        let after: string | undefined;
        if (options?.cursor) {
            after = decodeCursor(options.cursor);
            if (after === undefined) {
                return Result.fail(new KeyValueInvalidCursorError(options.cursor));
            }
        }

        try {
            const { items, lastKey } = await this.storageOperations.list({
                prefix,
                scope,
                limit: resolveLimit(options?.limit),
                after
            });

            return Result.ok({
                items: items as IKeyValueRecord<T>[],
                cursor: lastKey === null ? null : encodeCursor(lastKey)
            });
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
