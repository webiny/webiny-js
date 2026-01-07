import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { KeyValueStoreStorageOperations } from "./KeyValueStoreStorageOperations.js";

export interface CreateKeyValueStoreStorageOperations {
    (params: { documentClient: DynamoDBDocument }): KeyValueStoreStorageOperations;
}

export const createStorageOperations: CreateKeyValueStoreStorageOperations = params => {
    return new KeyValueStoreStorageOperations(params.documentClient);
};
