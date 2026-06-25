import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
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
import type { GenericRecord } from "@webiny/api/types.js";
import { DynamoDbDocumentClient } from "~/features/DynamoDbDocumentClient/DynamoDbDocumentClient.js";
import { DynamoDbBatchFactoryImpl } from "~/features/DynamoDbBatchFactory/DynamoDbBatchFactory.js";
import { DynamoDbEntityFactoryImpl } from "~/features/DynamoDbEntityFactory/DynamoDbEntityFactory.js";
import { createEntity } from "~/store/entity.js";
import { createPartitionKey, createSortKey, createType } from "~/store/keys.js";

interface ConstructorArgs {
    documentClient: DynamoDBDocument;
}

class DynamoDbDriver implements DbDriver<DynamoDBDocument> {
    public readonly documentClient;

    public readonly entity;

    constructor({ documentClient }: ConstructorArgs) {
        this.documentClient = documentClient;

        const client = new DynamoDbDocumentClient({
            documentClient,
            tableName: String(process.env.DB_TABLE)
        });
        const batchFactory = new DynamoDbBatchFactoryImpl();
        const entityFactory = new DynamoDbEntityFactoryImpl(batchFactory);

        this.entity = createEntity({
            client,
            entityFactory
        });
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
            await this.entity.put({
                PK: createPartitionKey(),
                SK: createSortKey({ key }),
                TYPE: createType(),
                data: {
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

        const batchWrite = this.entity.createEntityWriter();
        try {
            for (const key of keys) {
                const input = values[key];
                let value: string | undefined;
                try {
                    value = JSON.stringify(input);
                } catch (ex) {
                    throw ex;
                }
                batchWrite.put({
                    PK: createPartitionKey(),
                    SK: createSortKey({ key }),
                    TYPE: createType(),
                    data: {
                        key,
                        value
                    }
                });
            }

            await batchWrite.execute();
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
            const result = await this.entity.get({
                PK: createPartitionKey(),
                SK: createSortKey({ key })
            });
            return {
                key,
                data: result?.data?.value ? JSON.parse(result.data.value) : null
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

        const batchRead = this.entity.createEntityReader({
            read: keys.map(key => {
                return {
                    PK: createPartitionKey(),
                    SK: createSortKey({ key })
                };
            })
        });

        try {
            const results = await batchRead.execute();
            const data = keys.reduce((collection, initialKey) => {
                const key = initialKey as keyof V;
                const result = results.find(item => {
                    return item.PK === createPartitionKey() && item.SK === createSortKey({ key });
                });
                if (!result?.data?.value) {
                    collection[key] = null;
                    return collection;
                }
                try {
                    collection[key] = JSON.parse(result.data.value);
                } catch {
                    collection[key] = null;
                }

                return collection;
            }, {} as GenericRecord);
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
            const results = await this.entity.queryAll({
                partitionKey,
                options
            });

            const data = results.reduce((collection, item) => {
                const key = item.data.key as keyof V;
                try {
                    collection[key] = JSON.parse(item.data.value);
                } catch {
                    collection[key] = null;
                }

                return collection;
            }, {} as GenericRecord);

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
            await this.entity.delete({
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

        const batchDelete = this.entity.createEntityWriter({
            delete: keys.map(key => {
                return {
                    PK: createPartitionKey(),
                    SK: createSortKey({ key })
                };
            })
        });

        try {
            await batchDelete.execute();
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
