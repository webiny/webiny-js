import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { PluginCollection } from "@webiny/plugins/types.js";
import type { FileManagerStorageOperations } from "@webiny/api-file-manager/types.js";
import { AliasesStorageOperations } from "./AliasesStorageOperations.js";

export interface StorageOperationsConfig {
    documentClient: DynamoDBDocument;
    plugins?: PluginCollection;
}

export const createFileManagerStorageOperations = ({
    documentClient
}: StorageOperationsConfig): FileManagerStorageOperations => {
    return {
        aliases: new AliasesStorageOperations({ documentClient })
    };
};
