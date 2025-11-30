import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { PluginCollection } from "@webiny/plugins/types.js";
import type { FileAliasStorageOperations } from "@webiny/api-file-manager/types.js";
import { AliasesStorageOperations } from "./AliasesStorageOperations.js";

export interface StorageOperationsConfig {
    documentClient: DynamoDBDocument;
    plugins?: PluginCollection;
}

export const createFileManagerStorageOperations = ({
    documentClient
}: StorageOperationsConfig): FileAliasStorageOperations => {
    return new AliasesStorageOperations({ documentClient });
};
