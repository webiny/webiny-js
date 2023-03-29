import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Client } from "@elastic/elasticsearch";
import { PluginsContainer } from "@webiny/plugins";
import { FileManagerContext, FileManagerStorageOperations } from "@webiny/api-file-manager/types";
import { attachCreateIndexOnI18NCreate } from "./attachCreateIndexOnI18NCreate";
import { elasticsearchIndexPlugins } from "~/elasticsearch/indices";
import { createFileFieldsPlugins } from "~/operations/files/fields";
import { PluginCollection } from "@webiny/plugins/types";
import { FilesStorageOperations } from "~/operations/files/FilesStorageOperations";
import WebinyError from "@webiny/error";
import { SettingsStorageOperations } from "~/operations/settings/SettingsStorageOperations";
import { SystemStorageOperations } from "~/operations/system/SystemStorageOperations";
import {
    CompressionPlugin,
    ElasticsearchQueryBuilderOperatorPlugin
} from "@webiny/api-elasticsearch";
import dynamoDbValueFilters from "@webiny/db-dynamodb/plugins/filters";
import { FileManagerContextWithElasticsearch } from "~/types";
import {
    FileAttributePlugin,
    FileElasticsearchAttributePlugin,
    FileElasticsearchFieldPlugin,
    SettingsAttributePlugin,
    SystemAttributePlugin,
    FileElasticsearchBodyModifierPlugin,
    FileElasticsearchQueryModifierPlugin,
    FileElasticsearchSortModifierPlugin,
    FileElasticsearchIndexPlugin,
    FileIndexTransformPlugin
} from "./plugins";

export interface FileManagerStorageOperationsConfig {
    documentClient: DocumentClient;
    elasticsearchClient: Client;
    plugins?: PluginCollection;
}

export * from "./plugins";

export const createFileManagerStorageOperations = (
    config: FileManagerStorageOperationsConfig
): FileManagerStorageOperations => {
    const storagePlugins = new PluginsContainer([
        dynamoDbValueFilters(),
        elasticsearchIndexPlugins(),
        createFileFieldsPlugins(),
        ...(config.plugins || [])
    ]);

    let storageContext: FileManagerContext;

    const getTenantId = () => {
        return storageContext.tenancy.getCurrentTenant().id;
    };

    const getLocaleCode = () => {
        const locale = storageContext.i18n.getContentLocale();
        if (!locale) {
            throw new WebinyError(
                "Missing locale on context.i18n locale in File Manager DDB-ES Storage Operations.",
                "LOCALE_ERROR"
            );
        }
        return locale.code;
    };

    const storageOperationsConfig = {
        documentClient: config.documentClient,
        elasticsearchClient: config.elasticsearchClient,
        plugins: storagePlugins,
        getTenantId,
        getLocaleCode
    };

    return {
        async beforeInit(context) {
            const types: string[] = [
                // Elasticsearch
                CompressionPlugin.type,
                ElasticsearchQueryBuilderOperatorPlugin.type,
                // File Manager
                FileAttributePlugin.type,
                FileElasticsearchAttributePlugin.type,
                FileElasticsearchBodyModifierPlugin.type,
                FileElasticsearchFieldPlugin.type,
                FileElasticsearchIndexPlugin.type,
                FileElasticsearchQueryModifierPlugin.type,
                FileElasticsearchSortModifierPlugin.type,
                FileIndexTransformPlugin.type,
                SettingsAttributePlugin.type,
                SystemAttributePlugin.type
            ];
            for (const type of types) {
                storagePlugins.mergeByType(context.plugins, type);
            }

            storageContext = context;
            attachCreateIndexOnI18NCreate(
                context as FileManagerContextWithElasticsearch,
                storagePlugins
            );
        },
        files: new FilesStorageOperations(storageOperationsConfig),
        settings: new SettingsStorageOperations(storageOperationsConfig),
        system: new SystemStorageOperations(storageOperationsConfig)
    };
};
