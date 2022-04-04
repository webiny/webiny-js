import dynamoDbValueFilters from "@webiny/db-dynamodb/plugins/filters";
import elasticsearchPlugins from "./elasticsearch";
import dynamoDbPlugins from "./dynamoDb";
import { createSettingsStorageOperations } from "./operations/settings";
import { createSystemStorageOperations } from "./operations/system";
import { createModelsStorageOperations } from "./operations/model";
import { createEntriesStorageOperations } from "./operations/entry";
import { ENTITIES, StorageOperationsFactory } from "~/types";
import { createTable } from "~/definitions/table";
import { createElasticsearchTable } from "~/definitions/tableElasticsearch";
import { createGroupEntity } from "~/definitions/group";
import { createModelEntity } from "~/definitions/model";
import { createEntryEntity } from "~/definitions/entry";
import { createEntryElasticsearchEntity } from "~/definitions/entryElasticsearch";
import { createSystemEntity } from "~/definitions/system";
import { createSettingsEntity } from "~/definitions/settings";
import { HeadlessCms } from "@webiny/api-headless-cms/types";
import { createElasticsearchTemplate } from "~/operations/system/createElasticsearchTemplate";
import { PluginsContainer } from "@webiny/plugins";
import { createGroupsStorageOperations } from "~/operations/group";
import { getElasticsearchOperators } from "@webiny/api-elasticsearch/operators";
import { elasticsearchFields as cmsEntryElasticsearchFields } from "~/operations/entry/elasticsearchFields";

export const createStorageOperations: StorageOperationsFactory = params => {
    const {
        attributes,
        table,
        esTable,
        documentClient,
        elasticsearch,
        plugins: customPlugins,
        modelFieldToGraphQLPlugins
    } = params;

    const tableInstance = createTable({
        table,
        documentClient
    });
    const tableElasticsearchInstance = createElasticsearchTable({
        table: esTable,
        documentClient
    });

    const entities = {
        settings: createSettingsEntity({
            entityName: ENTITIES.SETTINGS,
            table: tableInstance,
            attributes: attributes ? attributes[ENTITIES.SETTINGS] : {}
        }),
        system: createSystemEntity({
            entityName: ENTITIES.SYSTEM,
            table: tableInstance,
            attributes: attributes ? attributes[ENTITIES.SYSTEM] : {}
        }),
        groups: createGroupEntity({
            entityName: ENTITIES.GROUPS,
            table: tableInstance,
            attributes: attributes ? attributes[ENTITIES.GROUPS] : {}
        }),
        models: createModelEntity({
            entityName: ENTITIES.MODELS,
            table: tableInstance,
            attributes: attributes ? attributes[ENTITIES.MODELS] : {}
        }),
        entries: createEntryEntity({
            entityName: ENTITIES.ENTRIES,
            table: tableInstance,
            attributes: attributes ? attributes[ENTITIES.ENTRIES] : {}
        }),
        entriesEs: createEntryElasticsearchEntity({
            entityName: ENTITIES.ENTRIES_ES,
            table: tableElasticsearchInstance,
            attributes: attributes ? attributes[ENTITIES.ENTRIES_ES] : {}
        })
    };

    const plugins = new PluginsContainer([
        /**
         * User defined custom plugins.
         */
        ...(customPlugins || []),
        /**
         * Plugins of type CmsModelFieldToGraphQLPlugin.
         */
        modelFieldToGraphQLPlugins,
        /**
         * Elasticsearch field definitions for the entry record.
         */
        cmsEntryElasticsearchFields,
        /**
         * DynamoDB filter plugins for the where conditions.
         */
        dynamoDbValueFilters(),
        /**
         * Elasticsearch operators.
         */
        getElasticsearchOperators(),
        /**
         * Field plugins for DynamoDB.
         */
        dynamoDbPlugins(),
        /**
         * Field plugins for Elasticsearch.
         */
        elasticsearchPlugins()
    ]);

    return {
        init: async (cms: HeadlessCms) => {
            cms.onBeforeSystemInstall.subscribe(async ({ tenant }) => {
                await createElasticsearchTemplate({
                    elasticsearch,
                    plugins
                });
            });
        },
        plugins: [
            /**
             * Field plugins for DynamoDB.
             * We must pass them to the base application.
             */
            dynamoDbPlugins()
        ],
        getEntities: () => entities,
        getTable: () => tableInstance,
        getEsTable: () => tableElasticsearchInstance,
        system: createSystemStorageOperations({
            entity: entities.system
        }),
        settings: createSettingsStorageOperations({
            entity: entities.settings
        }),
        groups: createGroupsStorageOperations({
            entity: entities.groups,
            plugins
        }),
        models: createModelsStorageOperations({
            entity: entities.models,
            elasticsearch
        }),
        entries: createEntriesStorageOperations({
            entity: entities.entries,
            esEntity: entities.entriesEs,
            plugins,
            elasticsearch
        })
    };
};
