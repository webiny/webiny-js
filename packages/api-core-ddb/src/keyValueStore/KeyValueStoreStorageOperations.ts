import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { WebinyError } from "@webiny/error";
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

    async get(key: string, scope: string): Promise<KeyValueRecord | null> {
        try {
            const scopedKey = this.createScopedKey(key, scope);
            const entry = await this.entity.get(this.table.createKeys({ scopedKey }));

            if (!entry) {
                return null;
            }

            // Return the user-facing key without scope prefix
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

    async set(key: string, value: any, scope: string): Promise<void> {
        try {
            const scopedKey = this.createScopedKey(key, scope);
            const keys = {
                ...this.table.createKeys({ scopedKey }),
                ...this.table.createGsiKeys({ scope, scopedKey })
            };

            await this.entity.put({
                ...keys,
                TYPE: "KeyValueStore",
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

    async listByPrefix(keyPrefix: string, scope: string): Promise<KeyValueRecord[]> {
        try {
            const scopedPrefix = this.createScopedKey(keyPrefix, scope);

            const records = await this.entity.queryAll({
                partitionKey: `KV#${scope}`,
                options: {
                    index: "GSI1",
                    beginsWith: `KEY#${scopedPrefix}`
                }
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
