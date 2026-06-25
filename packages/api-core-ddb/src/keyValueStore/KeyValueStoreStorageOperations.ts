import { DynamoDbTableFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import { DynamoDbEntityFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import { WebinyError } from "@webiny/error";
import { KeyValueStorageOperations as KeyValueStorageOperationsAbstraction } from "@webiny/api-core/features/keyValueStore/abstractions.js";
import type { IKeyValueStoreSetOptions } from "@webiny/api-core/features/keyValueStore/abstractions.js";
import { KeyValueStoreDynamoTable } from "./KeyValueStoreDynamoTable.js";

interface KeyValueRecord {
    key: string;
    value: any;
    scope: string;
}

class KeyValueStoreStorageOperations implements KeyValueStorageOperationsAbstraction.Interface {
    private readonly table;
    private readonly entity;

    constructor(
        tableFactory: DynamoDbTableFactory.Interface,
        entityFactory: DynamoDbEntityFactory.Interface
    ) {
        this.table = new KeyValueStoreDynamoTable<KeyValueRecord>(tableFactory, entityFactory);
        this.entity = this.table.getEntity();
    }

    private createScopedKey(key: string, scope: string): string {
        return `${scope}:${key}`;
    }

    public async get(key: string, scope: string): Promise<KeyValueRecord | null> {
        try {
            const scopedKey = this.createScopedKey(key, scope);
            const entry = await this.entity.get(this.table.createKeys({ scopedKey }));

            if (!entry) {
                return null;
            }

            const ttl = Number(entry.expiresAt);
            if (ttl && ttl <= Math.floor(Date.now() / 1000)) {
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

    public async set(
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

    public async delete(key: string, scope: string): Promise<void> {
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
}

export const KeyValueStorageOperations = KeyValueStorageOperationsAbstraction.createImplementation({
    implementation: KeyValueStoreStorageOperations,
    dependencies: [DynamoDbTableFactory, DynamoDbEntityFactory]
});
