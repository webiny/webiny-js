import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { WebinyError } from "@webiny/error";
import type { IKeyValueStorageListParams } from "@webiny/api-core/features/keyValueStore/abstractions.js";
import type { IKeyValueStorageListResult } from "@webiny/api-core/features/keyValueStore/abstractions.js";
import type { IKeyValueStoreSetOptions } from "@webiny/api-core/features/keyValueStore/abstractions.js";
import type { IKeyValueStoreConditionalOptions } from "@webiny/api-core/features/keyValueStore/abstractions.js";
import type { IGlobalEntityAttributes } from "@webiny/db-dynamodb";
import { KeyValueStoreDynamoTable } from "./KeyValueStoreDynamoTable.js";
import type { KeyValueComparable } from "@webiny/api-core/features/keyValueStore/abstractions.js";

interface KeyValueRecord {
    key: string;
    value: any;
    scope: string;
}

const nowInSeconds = (): number => {
    return Math.floor(Date.now() / 1000);
};

const isExpired = (expiresAt: unknown): boolean => {
    const ttl = Number(expiresAt);
    return Boolean(ttl) && ttl <= nowInSeconds();
};

const isConditionFailed = (error: unknown): boolean => {
    return (error as { name?: unknown })?.name === "ConditionalCheckFailedException";
};

interface ICondition {
    expression: string;
    names: Record<string, string>;
    values: Record<string, unknown>;
}

/*
 * `expiresAt` is in epoch seconds, as `set` writes it. DynamoDB's TTL deletes expired items late,
 * so each condition checks the time itself. DynamoDB rejects a name or value the expression does
 * not use, so each condition carries exactly its own.
 */
const absentCondition = (): ICondition => {
    return {
        expression: "attribute_not_exists(#pk) OR #expiresAt <= :now",
        names: { "#pk": "PK", "#expiresAt": "expiresAt" },
        values: { ":now": nowInSeconds() }
    };
};

const liveAndEqualCondition = (expected: unknown): ICondition => {
    return {
        expression:
            "#data.#value = :expected AND (attribute_not_exists(#expiresAt) OR #expiresAt > :now)",
        names: { "#data": "data", "#value": "value", "#expiresAt": "expiresAt" },
        values: { ":expected": expected, ":now": nowInSeconds() }
    };
};

export class KeyValueStoreStorageOperations {
    private readonly table;
    private readonly entity;
    private readonly client;

    constructor(dynamoDbClient: DynamoDBDocument) {
        this.table = new KeyValueStoreDynamoTable<KeyValueRecord>(dynamoDbClient);
        this.entity = this.table.getEntity();
        this.client = dynamoDbClient;
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

            if (isExpired(entry.expiresAt)) {
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
            const item = this.createItem(key, value, scope, options?.expiresAt);

            /*
             * A put replaces the whole item, so a write without a collection also drops GSI1 keys
             * an earlier write gave it, which takes the record out of that collection.
             */
            const collection = options?.collection;
            if (collection) {
                const listKeys = this.table.createListKeys({ key, scope, collection });
                Object.assign(item, listKeys);
            }

            await this.entity.put(item);
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not set key-value record.",
                code: "SET_KEY_VALUE_ERROR",
                data: { key, scope }
            });
        }
    }

    async setIfAbsent(
        key: string,
        value: any,
        scope: string,
        options?: IKeyValueStoreConditionalOptions
    ): Promise<boolean> {
        try {
            const item = this.createItem(key, value, scope, options?.expiresAt);
            const condition = absentCondition();
            await this.putIf(item, condition);
            return true;
        } catch (err) {
            if (isConditionFailed(err)) {
                return false;
            }
            throw WebinyError.from(err, {
                message: "Could not conditionally set key-value record.",
                code: "SET_IF_ABSENT_KEY_VALUE_ERROR",
                data: { key, scope }
            });
        }
    }

    async replaceIf(
        key: string,
        expected: KeyValueComparable,
        value: any,
        scope: string,
        options?: IKeyValueStoreConditionalOptions
    ): Promise<boolean> {
        try {
            const item = this.createItem(key, value, scope, options?.expiresAt);
            const condition = liveAndEqualCondition(expected);
            await this.putIf(item, condition);
            return true;
        } catch (err) {
            if (isConditionFailed(err)) {
                return false;
            }
            throw WebinyError.from(err, {
                message: "Could not conditionally replace key-value record.",
                code: "REPLACE_IF_KEY_VALUE_ERROR",
                data: { key, scope }
            });
        }
    }

    async deleteIf(key: string, expected: KeyValueComparable, scope: string): Promise<boolean> {
        try {
            const scopedKey = this.createScopedKey(key, scope);
            const keys = this.table.createKeys({ scopedKey });
            const params = this.entity.entity.deleteParams(keys);
            const condition = liveAndEqualCondition(expected);
            await this.client.delete({
                ...params,
                ConditionExpression: condition.expression,
                ExpressionAttributeNames: {
                    ...params.ExpressionAttributeNames,
                    ...condition.names
                },
                ExpressionAttributeValues: {
                    ...params.ExpressionAttributeValues,
                    ...condition.values
                }
            });
            return true;
        } catch (err) {
            if (isConditionFailed(err)) {
                return false;
            }
            throw WebinyError.from(err, {
                message: "Could not conditionally delete key-value record.",
                code: "DELETE_IF_KEY_VALUE_ERROR",
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
            const partitionKey = this.table.createListPartitionKey(scope, collection);

            let startKey: Record<string, string> | undefined;
            if (after !== undefined) {
                startKey = this.createStartKey({ key: after, scope, collection });
            }

            // One extra record tells whether another page exists without a second, empty read.
            const { items, lastEvaluatedKey } = await this.entity.queryPerPage<
                IGlobalEntityAttributes<KeyValueRecord>
            >({
                partitionKey,
                options: {
                    index: "GSI1",
                    limit: limit + 1,
                    reverse,
                    startKey
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
                    .filter(item => !isExpired(item.expiresAt))
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

    private createItem(
        key: string,
        value: any,
        scope: string,
        expiresAt: Date | undefined
    ): IGlobalEntityAttributes<KeyValueRecord> {
        const scopedKey = this.createScopedKey(key, scope);
        const keys = this.table.createKeys({ scopedKey });

        return {
            ...keys,
            TYPE: "KeyValueStore",
            expiresAt: expiresAt ? Math.floor(expiresAt.getTime() / 1000) : undefined,
            data: {
                key,
                value,
                scope
            }
        };
    }

    /*
     * The entity builds the same put it would send itself, so a conditional write stores the item
     * exactly as `set` does; only the condition is added. A put replaces the whole item, GSI1 keys
     * included, which leaves the record in no collection.
     */
    private async putIf(
        item: IGlobalEntityAttributes<KeyValueRecord>,
        condition: ICondition
    ): Promise<void> {
        const params = this.entity.entity.putParams(item, { strictSchemaCheck: false });
        await this.client.put({
            ...params,
            ConditionExpression: condition.expression,
            ExpressionAttributeNames: { ...params.ExpressionAttributeNames, ...condition.names },
            ExpressionAttributeValues: { ...params.ExpressionAttributeValues, ...condition.values }
        });
    }

    /**
     * A GSI query resumes from the full key of an item: the table's own PK and SK as well as the
     * index's. All four follow from the scope, collection and key, so the item does not have to
     * exist any more.
     */
    private createStartKey(params: { key: string; scope: string; collection: string }) {
        const { key, scope } = params;
        const scopedKey = this.createScopedKey(key, scope);
        const tableKeys = this.table.createKeys({ scopedKey });
        const listKeys = this.table.createListKeys(params);

        return { ...tableKeys, ...listKeys };
    }
}
