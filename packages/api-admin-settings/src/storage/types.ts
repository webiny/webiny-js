import { TableConstructor } from "dynamodb-toolbox/dist/classes/Table";
import { DynamoDBClient } from "@webiny/aws-sdk/client-dynamodb";
import { AdminSettings, AdminSettingsVariant } from "~/types";

export interface TableModifier {
    (table: TableConstructor): TableConstructor;
}

export interface StorageOperationsFactoryParams {
    documentClient: DynamoDBClient;
    table?: TableModifier;
}

export interface StorageOperationsSettingsService {
    getSettings: (variant: AdminSettingsVariant) => Promise<AdminSettings | null>;
}
export interface StorageOperationsService {
    settings: StorageOperationsSettingsService;
}

export interface StorageOperationsFactory {
    (params: StorageOperationsFactoryParams): Promise<StorageOperationsService>;
}
