import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { WebinyError } from "@webiny/error";
import type {
    IKeyValueStorageListParams,
    IKeyValueStorageListResult,
    IKeyValueStoreSetOptions
} from "@webiny/api-core/features/keyValueStore/abstractions.js";
import type { IGlobalEntityAttributes } from "@webiny/db-dynamodb";
import { KeyValueStoreDynamoTable } from "./KeyValueStoreDynamoTable.js";

interface KeyValueRecord {
    key: string;
    value: any;
    scope: string;
}

export class KeyValueStoreStorageOperations {
    private readonly table;
    private readonly entity;

    constructor(dynamoDbClient: DynamoDBDocument) {
        this.table = new KeyValueStoreDynamoTable<KeyValueRecord>(dynamoDbClient);
        this.entity = this.table.getEntity();
    }

    private createScopedKey(key: string, scope: string): string {
        return `${scope}:${key}`;
    }

    private isExpired(expiresAt: unknown): boolean {
        const ttl = Number(expiresAt);
        return Boolean(ttl) && ttl <= Math.floor(Date.now() / 1000);
    }

    async get(key: string, scope: string): Promise<KeyValueRecord | null> {
        try {
            const scopedKey = this.createScopedKey(key, scope);
            const entry = await this.entity.get(this.table.createKeys({ scopedKey }));

            if (!entry) {
                return null;
            }

            if (this.isExpired(entry.expiresAt)) {
                return null;
            }

            return {
                key,
                value: entry.data.value,
                scope: entry.data.scope
            };
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not get key-value record.",
                code: "GET_KEY_VALUE_ERROR",
                data: { key, scope }
            });
        }
    }

    async set(
        key: string,
        value: any,
        scope: string,
        options?: IKeyValueStoreSetOptions
    ): Promise<void> {
        try {
            const scopedKey = this.createScopedKey(key, scope);
            const keys = this.table.createKeys({ scopedKey });

            const collection = options?.collection;

            // A put replaces the whole item, so a write without a collection also drops GSI1 keys
            // an earlier write gave it, which takes the record out of that collection.
            await this.entity.put({
                ...keys,
                ...(collection ? this.table.createListKeys({ key, scope, collection }) : {}),
                TYPE: "KeyValueStore",
                expiresAt: options?.expiresAt
                    ? Math.floor(options.expiresAt.getTime() / 1000)
                    : undefined,
                data: {
                    key,
                    value,
                    scope
                }
            });
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not set key-value record.",
                code: "SET_KEY_VALUE_ERROR",
                data: { key, scope }
            });
        }
    }

    async delete(key: string, scope: string): Promise<void> {
        try {
            const scopedKey = this.createScopedKey(key, scope);
            await this.entity.delete(this.table.createKeys({ scopedKey }));
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not delete key-value record.",
                code: "DELETE_KEY_VALUE_ERROR",
                data: { key, scope }
            });
        }
    }

    async list(params: IKeyValueStorageListParams): Promise<IKeyValueStorageListResult> {
        const { collection, scope, limit, reverse, after } = params;
        try {
            // One extra record tells whether another page exists without a second, empty read.
            const { items, lastEvaluatedKey } = await this.entity.queryPerPage<
                IGlobalEntityAttributes<KeyValueRecord>
            >({
                partitionKey: this.table.createListPartitionKey(scope, collection),
                options: {
                    index: "GSI1",
                    limit: limit + 1,
                    reverse,
                    startKey:
                        after === undefined
                            ? undefined
                            : this.createStartKey({ key: after, scope, collection })
                }
            });

            const page = items.slice(0, limit);
            // A key DynamoDB holds as "" comes back as null from the entity.
            const keyOf = (item: (typeof items)[number]) => item.data.key ?? "";

            let lastKey: string | null = null;
            if (items.length > limit) {
                lastKey = keyOf(page[page.length - 1]);
            } else if (lastEvaluatedKey) {
                // The 1 MB read limit cut the page short of `limit`.
                lastKey = this.table.parseListSortKey(lastEvaluatedKey.GSI1_SK as string);
            }

            return {
                items: page
                    .filter(item => !this.isExpired(item.expiresAt))
                    .map(item => ({ key: keyOf(item), value: item.data.value })),
                lastKey
            };
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not list key-value records.",
                code: "LIST_KEY_VALUE_ERROR",
                data: { collection, scope, after }
            });
        }
    }

    /**
     * A GSI query resumes from the full key of an item: the table's own PK and SK as well as the
     * index's. All four follow from the scope, collection and key, so the item does not have to
     * exist any more.
     */
    private createStartKey(params: { key: string; scope: string; collection: string }) {
        const { key, scope } = params;
        return {
            ...this.table.createKeys({ scopedKey: this.createScopedKey(key, scope) }),
            ...this.table.createListKeys(params)
        };
    }
}
