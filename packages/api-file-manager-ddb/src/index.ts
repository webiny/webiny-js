import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import ddbPlugins from "@webiny/db-dynamodb/plugins/index.js";
import { PluginsContainer } from "@webiny/plugins";
import type { PluginCollection } from "@webiny/plugins/types.js";
import type { FileManagerStorageOperations } from "@webiny/api-file-manager/types.js";
import { FilesStorageOperations } from "~/operations/FilesStorageOperations.js";
import { SettingsStorageOperations } from "~/operations/SettingsStorageOperations.js";
import { SettingsAttributePlugin } from "./plugins/index.js";
import { AliasesStorageOperations } from "~/operations/AliasesStorageOperations.js";
import { CompressorPlugin } from "@webiny/api";

export interface StorageOperationsConfig {
    documentClient: DynamoDBDocument;
    plugins?: PluginCollection;
}

export * from "./plugins/index.js";

export const createFileManagerStorageOperations = ({
    documentClient,
    plugins: userPlugins
}: StorageOperationsConfig): FileManagerStorageOperations => {
    const plugins = new PluginsContainer([
        ddbPlugins(),
        // User plugins
        ...(userPlugins || [])
    ]);

    return {
        beforeInit: async context => {
            const types: string[] = [SettingsAttributePlugin.type, CompressorPlugin.type];
            for (const type of types) {
                plugins.mergeByType(context.plugins, type);
            }
        },
        files: new FilesStorageOperations(),
        aliases: new AliasesStorageOperations({ documentClient }),
        settings: new SettingsStorageOperations({ documentClient })
    };
};
