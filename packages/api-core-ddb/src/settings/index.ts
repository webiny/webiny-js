import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { SettingsStorageOperations } from "./SettingsStorageOperations.js";

export interface CreateSettingsStorageOperations {
    (params: { documentClient: DynamoDBDocument }): SettingsStorageOperations;
}

export const createStorageOperations: CreateSettingsStorageOperations = params => {
    return new SettingsStorageOperations(params.documentClient);
};
