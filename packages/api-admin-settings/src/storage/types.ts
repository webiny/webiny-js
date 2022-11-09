import { TableConstructor } from "dynamodb-toolbox/dist/classes/Table";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { AdminSettings, AdminSettingsVariant } from "~/types";

export interface TableModifier {
    (table: TableConstructor): TableConstructor;
}

export interface StorageOperationsFactoryParams {
    documentClient: DocumentClient;
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
