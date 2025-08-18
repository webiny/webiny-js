import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb";
import type {
    DbDriver,
    GetValueResult,
    GetValuesResult,
    IListValuesParams,
    ListValuesResult,
    RemoveValueResult,
    RemoveValuesResult,
    StorageKey,
    StoreValueResult,
    StoreValuesResult
} from "@webiny/db";
import type { Entity } from "dynamodb-toolbox";
import type { Table } from "~/utils/createTable";
import { createTable } from "~/utils/createTable";
import type { GenericRecord } from "@webiny/api/types";
import { createEntity } from "~/store/entity";
import { batchReadAll, batchWriteAll, get, put, queryAll } from "~/utils";
import { createPartitionKey, createSortKey, createType } from "~/store/keys";
import type { IStoreItem } from "~/store/types";

interface ConstructorArgs {
    documentClient: DynamoDBDocument;
}

class DynamoDbDriver implements DbDriver<DynamoDBDocument> {
    public readonly documentClient: DynamoDBDocument;

    private _table: Table | undefined = undefined;
    private _entity: Entity | undefined = undefined;

    public table(): Table {
        if (this._table) {
            return this._table;
        }
        this._table = createTable({
            documentClient: this.documentClient
        });
        return this._table;
    }

    public entity(): Entity {
        if (this._entity) {
            return this._entity;
        }
        this._entity = createEntity({
            table: this.table()
        });
        return this._entity;
    }

    constructor({ documentClient }: ConstructorArgs) {
        this.documentClient = documentClient;
    }

    public getClient() {
        return this.documentClient;
    }

    public async storeValue<V>(key: string, input: V): Promise<StoreValueResult<V>> {
        let value: string | undefined;
        try {
            value = JSON.stringify(input);
        } catch (ex) {
            return {
                key,
                error: ex
            };
        }

        try {
            await put<IStoreItem>({
                entity: this.entity(),
                item: {
                    PK: createPartitionKey(),
                    SK: createSortKey({ key }),
                    TYPE: createType(),
                    key,
                    value
                }
            });

            return {
                key,
                data: input
            };
        } catch (ex) {
            return {
                key,
                error: ex
            };
        }
    }
    public async storeValues<V extends GenericRecord<StorageKey>>(
        values: V
    ): Promise<StoreValuesResult<V>> {
        const keys = Object.keys(values);
        try {
            const batch = keys.map(key => {
                const input = values[key];
                let value: string | undefined;
                try {
                    value = JSON.stringify(input);
                } catch (ex) {
                    throw ex;
                }
                const item: IStoreItem = {
                    PK: createPartitionKey(),
                    SK: createSortKey({ key }),
                    TYPE: createType(),
                    key,
                    value
                };
                return this.entity().putBatch(item);
            });

            await batchWriteAll({
                table: this.table(),
                items: batch
            });
            return {
                keys,
                data: values
            };
        } catch (ex) {
            return {
                keys,
                error: ex
            };
        }
    }
    public async getValue<V>(key: StorageKey): Promise<GetValueResult<V>> {
        try {
            const result = await get<IStoreItem>({
                entity: this.entity(),
                keys: {
                    PK: createPartitionKey(),
                    SK: createSortKey({ key })
                }
            });
            return {
                key,
                data: result ? JSON.parse(result.value) : null
            };
        } catch (ex) {
            return {
                key,
                error: ex
            };
        }
    }
    public async getValues<V extends GenericRecord<StorageKey>>(
        input: (keyof V)[]
    ): Promise<GetValuesResult<V>> {
        const keys = [...input] as string[];
        const batch = keys.map(key => {
            return this.entity().getBatch({
                PK: createPartitionKey(),
                SK: createSortKey({ key })
            });
        });

        try {
            const results = await batchReadAll<IStoreItem>({
                table: this.table(),
                items: batch
            });
            const data = keys.reduce((collection, key) => {
                const result = results.find(item => {
                    return item.PK === createPartitionKey() && item.SK === createSortKey({ key });
                });
                if (!result?.value) {
                    // @ts-expect-error
                    collection[key] = null;
                    return collection;
                }
                try {
                    // @ts-expect-error
                    collection[key] = JSON.parse(result.value);
                } catch {
                    // @ts-expect-error
                    collection[key] = null;
                }

                return collection;
            }, {} as V);
            return {
                keys,
                data
            };
        } catch (ex) {
            return {
                keys,
                error: ex
            };
        }
    }
    public async listValues<V extends GenericRecord<StorageKey>>(
        params?: IListValuesParams
    ): Promise<ListValuesResult<V>> {
        try {
            const partitionKey = createPartitionKey();
            const options = {
                ...params
            };
            const results = await queryAll<IStoreItem>({
                entity: this.entity(),
                partitionKey,
                options
            });

            const data = results.reduce((collection, item) => {
                try {
                    // @ts-expect-error
                    collection[item.key] = JSON.parse(item.value);
                } catch {
                    // @ts-expect-error
                    collection[item.key] = null;
                }

                return collection;
            }, {} as V);

            return {
                keys: Object.keys(data),
                data
            };
        } catch (ex) {
            return {
                error: ex
            };
        }
    }

    public async removeValue<V>(key: StorageKey): Promise<RemoveValueResult<V>> {
        const result = await this.getValue<V>(key);
        if (result.error) {
            return {
                key,
                error: result.error
            };
        }
        try {
            await this.entity().delete({
                PK: createPartitionKey(),
                SK: createSortKey({ key })
            });
            return {
                key,
                data: result.data
            };
        } catch (ex) {
            return {
                key,
                error: ex
            };
        }
    }

    public async removeValues<V extends GenericRecord<StorageKey>>(
        input: (keyof V)[]
    ): Promise<RemoveValuesResult<V>> {
        const keys = [...input] as string[];
        const batch = keys.map(key => {
            return this.entity().deleteBatch({
                PK: createPartitionKey(),
                SK: createSortKey({ key })
            });
        });

        try {
            await batchWriteAll({
                table: this.table(),
                items: batch
            });
            return {
                keys
            };
        } catch (ex) {
            return {
                keys,
                error: ex
            };
        }
    }
}

export default DynamoDbDriver;
