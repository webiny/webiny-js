import dynamoDbValueFilters from "@webiny/db-dynamodb/plugins/filters";
import elasticsearchPlugins from "./elasticsearch";
import dynamoDbPlugins from "./dynamoDb";
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
import { createElasticsearchIndex } from "~/elasticsearch/createElasticsearchIndex";
import { PluginsContainer } from "@webiny/plugins";
import { createGroupsStorageOperations } from "~/operations/group";
import {
    CompressionPlugin,
    ElasticsearchQueryBuilderOperatorPlugin
} from "@webiny/api-elasticsearch";
import { elasticsearchIndexPlugins } from "./elasticsearch/indices";
import { deleteElasticsearchIndex } from "./elasticsearch/deleteElasticsearchIndex";
import {
    CmsElasticsearchModelFieldPlugin,
    CmsEntryElasticsearchBodyModifierPlugin,
    CmsEntryElasticsearchFullTextSearchPlugin,
    CmsEntryElasticsearchIndexPlugin,
    CmsEntryElasticsearchQueryBuilderValueSearchPlugin,
    CmsEntryElasticsearchQueryModifierPlugin,
    CmsEntryElasticsearchSortModifierPlugin,
    CmsEntryElasticsearchValuesModifier
} from "~/plugins";
import { createFilterPlugins } from "~/operations/entry/elasticsearch/filtering/plugins";
import { CmsEntryFilterPlugin } from "~/plugins/CmsEntryFilterPlugin";
import { StorageOperationsCmsModelPlugin, StorageTransformPlugin } from "@webiny/api-headless-cms";
import { createElasticsearchIndexesOnLocaleAfterCreate } from "~/operations/system/indexes";
import { createIndexTaskPluginTest } from "~/tasks/createIndexTaskPlugin";

export * from "./plugins";

export const createStorageOperations: StorageOperationsFactory = params => {
    const {
        attributes,
        table,
        esTable,
        documentClient,
        elasticsearch,
        plugins: userPlugins
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
         * DynamoDB filter plugins for the where conditions.
         */
        dynamoDbValueFilters(),
        /**
         * Field plugins for DynamoDB.
         */
        dynamoDbPlugins(),
        /**
         * Field plugins for Elasticsearch.
         */
        elasticsearchPlugins(),
        /**
         * Built-in Elasticsearch index templates.
         */
        elasticsearchIndexPlugins(),
        /**
         * Filter plugins used to apply filtering from where conditions to Elasticsearch query.
         */
        createFilterPlugins(),
        /**
         * User defined custom plugins.
         * They are at the end because we can then override existing plugins.
         */
        ...(userPlugins || [])
    ]);

    const entries = createEntriesStorageOperations({
        entity: entities.entries,
        esEntity: entities.entriesEs,
        plugins,
        elasticsearch
    });

    return {
        name: "dynamodb:elasticsearch",
        beforeInit: async context => {
            /**
             * Attach the elasticsearch into context if it is not already attached.
             */
            if (!context.elasticsearch) {
                context.elasticsearch = elasticsearch;
            }
            /**
             * Pass the plugins to the parent context.
             */
            context.plugins.register([
                dynamoDbPlugins(),
                createIndexTaskPluginTest(),
                elasticsearchIndexPlugins()
            ]);
            /**
             * We need to fetch all the plugin types in the list from the main container.
             * This way we do not need to register plugins in the storage plugins contains.
             */
            const types: string[] = [
                // Elasticsearch
                CompressionPlugin.type,
                ElasticsearchQueryBuilderOperatorPlugin.type,
                // Headless CMS
                "cms-model-field-to-graphql",
                CmsEntryFilterPlugin.type,
                CmsEntryElasticsearchBodyModifierPlugin.type,
                CmsEntryElasticsearchFullTextSearchPlugin.type,
                CmsEntryElasticsearchIndexPlugin.type,
                CmsEntryElasticsearchQueryBuilderValueSearchPlugin.type,
                CmsEntryElasticsearchQueryModifierPlugin.type,
                CmsEntryElasticsearchSortModifierPlugin.type,
                CmsElasticsearchModelFieldPlugin.type,
                StorageOperationsCmsModelPlugin.type,
                StorageTransformPlugin.type,
                CmsEntryElasticsearchValuesModifier.type
            ];
            for (const type of types) {
                plugins.mergeByType(context.plugins, type);
            }
            entries.dataLoaders.clearAll();
        },
        init: async context => {
            /**
             * We need to create indexes on before model create and on clone (create from).
             * Other apps create indexes on locale creation.
             */
            await createElasticsearchIndexesOnLocaleAfterCreate({
                context,
                client: elasticsearch,
                plugins
            });

            context.cms.onModelBeforeCreate.subscribe(async ({ model }) => {
                await createElasticsearchIndex({
                    client: elasticsearch,
                    model,
                    plugins
                });
            });
            context.cms.onModelBeforeCreateFrom.subscribe(async ({ model }) => {
                await createElasticsearchIndex({
                    client: elasticsearch,
                    model,
                    plugins
                });
            });
            context.cms.onModelAfterDelete.subscribe(async ({ model }) => {
                await deleteElasticsearchIndex({
                    client: elasticsearch,
                    model
                });
            });

            context.cms.onModelInitialize.subscribe(async ({ model }) => {
                await createElasticsearchIndex({
                    client: elasticsearch,
                    model,
                    plugins
                });
            });
        },
        getEntities: () => entities,
        getTable: () => tableInstance,
        getEsTable: () => tableElasticsearchInstance,
        system: createSystemStorageOperations({
            entity: entities.system
        }),
        groups: createGroupsStorageOperations({
            entity: entities.groups,
            plugins
        }),
        models: createModelsStorageOperations({
            entity: entities.models,
            elasticsearch
        }),
        entries
    };
};
