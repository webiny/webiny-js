import { DocumentClient } from "aws-sdk/clients/dynamodb";
import ddbPlugins from "@webiny/db-dynamodb/plugins";
import { PluginsContainer } from "@webiny/plugins";
import { PluginCollection } from "@webiny/plugins/types";
import { FileManagerStorageOperations } from "@webiny/api-file-manager/types";
import { FilesStorageOperations } from "~/operations/files/FilesStorageOperations";
import { SettingsStorageOperations } from "~/operations/settings/SettingsStorageOperations";
import { SystemStorageOperations } from "~/operations/system/SystemStorageOperations";
import { createFileFieldsPlugins } from "~/operations/files/fields";
import {
    FileAttributePlugin,
    FileDynamoDbFieldPlugin,
    SettingsAttributePlugin,
    SystemAttributePlugin
} from "./plugins";

export interface StorageOperationsConfig {
    documentClient: DocumentClient;
    plugins?: PluginCollection;
}

export * from "./plugins";

export const createFileManagerStorageOperations = ({
    documentClient,
    plugins: userPlugins
}: StorageOperationsConfig): FileManagerStorageOperations => {
    const plugins = new PluginsContainer([
        ddbPlugins(),
        // Built-in plugins
        ...createFileFieldsPlugins(),
        // User plugins
        ...(userPlugins || [])
    ]);

    return {
        beforeInit: async context => {
            const types: string[] = [
                FileAttributePlugin.type,
                FileDynamoDbFieldPlugin.type,
                SettingsAttributePlugin.type,
                SystemAttributePlugin.type
            ];
            for (const type of types) {
                plugins.mergeByType(context.plugins, type);
            }
        },
        files: new FilesStorageOperations({ plugins, documentClient }),
        settings: new SettingsStorageOperations({ documentClient }),
        system: new SystemStorageOperations({ documentClient })
    };
};
