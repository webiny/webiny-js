import { TableConstructor } from "@webiny/db-dynamodb/toolbox";
import { DynamoDBClient } from "@webiny/aws-sdk/client-dynamodb";
import { AdminSettings, AdminSettingsVariant } from "~/types";

export interface TableModifier {
    (table: TableConstructor<string, string, string>): TableConstructor<string, string, string>;
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
