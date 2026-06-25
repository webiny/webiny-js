import type { DynamoDbTableFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import type { DynamoDbEntityFactory } from "@webiny/db-dynamodb/exports/api/db.js";
import { KeyValueStoreStorageOperations } from "./KeyValueStoreStorageOperations.js";

export interface CreateKeyValueStoreStorageOperations {
    (params: {
        tableFactory: DynamoDbTableFactory.Interface;
        entityFactory: DynamoDbEntityFactory.Interface;
    }): KeyValueStoreStorageOperations;
}

export const createStorageOperations: CreateKeyValueStoreStorageOperations = params => {
    return new KeyValueStoreStorageOperations(params.tableFactory, params.entityFactory);
};
