import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { WebinyError } from "@webiny/error";
import type {
    IKeyValueRecord,
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

            await this.entity.put({
                ...keys,
                ...this.table.createListKeys({ key, scope }),
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

    /**
     * Records written before `set` started filling GSI1 are not in the index, so they are not
     * listed until they are written again.
     */
    async list(prefix: string, scope: string): Promise<IKeyValueRecord[]> {
        try {
            const items = await this.entity.queryAll<IGlobalEntityAttributes<KeyValueRecord>>({
                partitionKey: this.table.createListPartitionKey(scope),
                options: {
                    index: "GSI1",
                    beginsWith: this.table.createListSortKey(prefix)
                }
            });

            return (
                items
                    .filter(item => !this.isExpired(item.expiresAt))
                    // The entity stores an empty string as null, and `""` is a valid key.
                    .map(item => ({ key: item.data.key ?? "", value: item.data.value }))
            );
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not list key-value records.",
                code: "LIST_KEY_VALUE_ERROR",
                data: { prefix, scope }
            });
        }
    }
}
