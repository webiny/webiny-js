import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { get, put, deleteItem } from "@webiny/db-dynamodb";
import type { QueryAllParams } from "@webiny/db-dynamodb/utils/query.js";
import { queryAll } from "@webiny/db-dynamodb/utils/query.js";
import { WebinyError } from "@webiny/error";
import { KeyValueStoreDynamoTable } from "./KeyValueStoreDynamoTable.js";

interface KeyValueRecord {
    key: string;
    value: any;
}

interface StorageRecord {
    data: KeyValueRecord;
}

export class KeyValueStoreStorageOperations {
    private table: KeyValueStoreDynamoTable;

    constructor(dynamoDbClient: DynamoDBDocument) {
        this.table = new KeyValueStoreDynamoTable(dynamoDbClient);
    }

    private createScopedKey(key: string, scope: string): string {
        return `${scope}:${key}`;
    }

    async get(key: string, scope: string): Promise<KeyValueRecord | null> {
        try {
            const scopedKey = this.createScopedKey(key, scope);
            const entry = await get<StorageRecord>({
                entity: this.table.getEntity(),
                keys: this.table.createKeys({ scopedKey })
            });

            if (!entry) {
                return null;
            }

            // Return the user-facing key without scope prefix
            return {
                key,
                value: entry.data.value
            };
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not get key-value record.",
                code: "GET_KEY_VALUE_ERROR",
                data: { key, scope }
            });
        }
    }

    async set(key: string, value: any, scope: string): Promise<void> {
        try {
            const scopedKey = this.createScopedKey(key, scope);
            const keys = {
                ...this.table.createKeys({ scopedKey }),
                ...this.table.createGsiKeys({ scope, scopedKey })
            };

            await put({
                entity: this.table.getEntity(),
                item: {
                    ...keys,
                    TYPE: "KeyValueStore",
                    data: {
                        key,
                        value,
                        scope
                    }
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
            await deleteItem({
                entity: this.table.getEntity(),
                keys: this.table.createKeys({ scopedKey })
            });
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not delete key-value record.",
                code: "DELETE_KEY_VALUE_ERROR",
                data: { key, scope }
            });
        }
    }

    async listByPrefix(keyPrefix: string, scope: string): Promise<KeyValueRecord[]> {
        try {
            const scopedPrefix = this.createScopedKey(keyPrefix, scope);
            const options: QueryAllParams["options"] = {
                index: "GSI1",
                beginsWith: `KEY#${scopedPrefix}`
            };

            const records = await queryAll<StorageRecord>({
                entity: this.table.getEntity(),
                partitionKey: `KV#${scope}`,
                options
            });

            // Return records with user-facing keys (already stored without scope prefix)
            return records.map(record => record.data);
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not list key-value records by prefix.",
                code: "LIST_KEY_VALUE_BY_PREFIX_ERROR",
                data: { keyPrefix, scope }
            });
        }
    }
}
