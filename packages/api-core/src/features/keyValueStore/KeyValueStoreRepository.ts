import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import {
    KeyValueStorageOperations,
    KeyValueStoreRepository as RepositoryAbstraction,
    type IKeyValueListParams,
    type IKeyValueListResult,
    type IKeyValueRecord,
    type IKeyValueStoreSetOptions
} from "./abstractions.js";
import {
    KeyNotFoundError,
    KeyValueStorageError,
    KeyValueInvalidCursorError,
    KeyValueInvalidCollectionError,
    KeyValueKeyTooLongError
} from "./errors.js";

const DEFAULT_LIST_LIMIT = 100;
const MAX_LIST_LIMIT = 1000;

const resolveLimit = (limit: number | undefined): number => {
    if (!limit || !Number.isFinite(limit)) {
        return DEFAULT_LIST_LIMIT;
    }
    return Math.min(Math.max(Math.floor(limit), 1), MAX_LIST_LIMIT);
};

interface ICursor {
    collection: string;
    reverse: boolean;
    after: string;
}

/*
 * The cursor carries the key the previous page stopped at, with the collection and direction it was
 * read in, so it cannot quietly continue a different listing. Encoded so callers treat it as opaque
 * and do not build one by hand, which leaves room to change what it carries.
 */
const encodeCursor = (cursor: ICursor): string => {
    return Buffer.from(JSON.stringify(cursor)).toString("base64url");
};

const decodeCursor = (cursor: string): ICursor | undefined => {
    try {
        const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
        if (
            typeof parsed?.collection !== "string" ||
            typeof parsed.reverse !== "boolean" ||
            typeof parsed.after !== "string"
        ) {
            return undefined;
        }
        return parsed;
    } catch {
        return undefined;
    }
};

/*
 * Both limits come from DynamoDB, where a collection member's key goes into a GSI sort key (1024
 * bytes at most) and the collection name into a GSI partition key (2048 bytes, shared with the
 * scope). Checked here rather than in the DynamoDB layer so every store rejects the same writes.
 */
const MAX_COLLECTION_BYTES = 1000;
const MAX_COLLECTION_KEY_BYTES = 1000;

const isValidCollection = (collection: unknown): collection is string => {
    return (
        typeof collection === "string" &&
        collection.length > 0 &&
        Buffer.byteLength(collection, "utf8") <= MAX_COLLECTION_BYTES
    );
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
        if (options?.collection !== undefined) {
            if (!isValidCollection(options.collection)) {
                return Result.fail(new KeyValueInvalidCollectionError(MAX_COLLECTION_BYTES));
            }
            if (Buffer.byteLength(key, "utf8") > MAX_COLLECTION_KEY_BYTES) {
                return Result.fail(new KeyValueKeyTooLongError(key, MAX_COLLECTION_KEY_BYTES));
            }
        }

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
        scope: string,
        params: IKeyValueListParams
    ): Promise<Result<IKeyValueListResult<T>, RepositoryAbstraction.Error>> {
        const { collection, cursor } = params;
        if (!isValidCollection(collection)) {
            return Result.fail(new KeyValueInvalidCollectionError(MAX_COLLECTION_BYTES));
        }

        let reverse = params.reverse ?? false;
        let after: string | undefined;
        if (cursor) {
            const decoded = decodeCursor(cursor);
            if (!decoded || decoded.collection !== collection) {
                return Result.fail(new KeyValueInvalidCursorError(cursor));
            }
            reverse = decoded.reverse;
            after = decoded.after;
        }

        try {
            const { items, lastKey } = await this.storageOperations.list({
                collection,
                scope,
                limit: resolveLimit(params.limit),
                reverse,
                after
            });

            return Result.ok({
                items: items as IKeyValueRecord<T>[],
                cursor:
                    lastKey === null ? null : encodeCursor({ collection, reverse, after: lastKey })
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
