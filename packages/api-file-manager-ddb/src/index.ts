import { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb";
import ddbPlugins from "@webiny/db-dynamodb/plugins";
import { PluginsContainer } from "@webiny/plugins";
import { PluginCollection } from "@webiny/plugins/types";
import { FileManagerStorageOperations } from "@webiny/api-file-manager/types";
import { FilesStorageOperations } from "~/operations/FilesStorageOperations";
import { SettingsStorageOperations } from "~/operations/SettingsStorageOperations";
import { SystemStorageOperations } from "~/operations/SystemStorageOperations";
import { SettingsAttributePlugin, SystemAttributePlugin } from "./plugins";
import { AliasesStorageOperations } from "~/operations/AliasesStorageOperations";

export interface StorageOperationsConfig {
    documentClient: DynamoDBDocument;
    plugins?: PluginCollection;
}

export * from "./plugins";

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
            const types: string[] = [SettingsAttributePlugin.type, SystemAttributePlugin.type];
            for (const type of types) {
                plugins.mergeByType(context.plugins, type);
            }
        },
        files: new FilesStorageOperations(),
        aliases: new AliasesStorageOperations({ documentClient }),
        settings: new SettingsStorageOperations({ documentClient }),
        system: new SystemStorageOperations({ documentClient })
    };
};
