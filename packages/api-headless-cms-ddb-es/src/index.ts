import dynamoDbValueFilters from "@webiny/db-dynamodb/plugins/filters/index.js";
import elasticsearchPlugins from "./elasticsearch/index.js";
import dynamoDbPlugins from "./dynamoDb/index.js";
import { createModelsStorageOperations } from "./operations/model/index.js";
import { createEntriesStorageOperations } from "./operations/entry/index.js";
import type { StorageOperationsFactory } from "~/types.js";
import { ENTITIES } from "~/types.js";
import { createGroupEntity } from "~/definitions/group.js";
import { createModelEntity } from "~/definitions/model.js";
import { createEntryEntity } from "~/definitions/entry.js";
import { createElasticsearchIndex } from "~/elasticsearch/createElasticsearchIndex.js";
import { PluginsContainer } from "@webiny/plugins";
import { createGroupsStorageOperations } from "~/operations/group/index.js";
import {
    createElasticsearchEntity,
    createElasticsearchTable,
    ElasticsearchQueryBuilderOperatorPlugin
} from "@webiny/api-elasticsearch";
import { elasticsearchIndexPlugins } from "./elasticsearch/indices/index.js";
import { deleteElasticsearchIndex } from "./elasticsearch/deleteElasticsearchIndex.js";
import {
    CmsElasticsearchModelFieldPlugin,
    CmsEntryElasticsearchBodyModifierPlugin,
    CmsEntryElasticsearchFullTextSearchPlugin,
    CmsEntryElasticsearchIndexPlugin,
    CmsEntryElasticsearchQueryBuilderValueSearchPlugin,
    CmsEntryElasticsearchQueryModifierPlugin,
    CmsEntryElasticsearchSortModifierPlugin,
    CmsEntryElasticsearchValuesModifier
} from "~/plugins/index.js";
import { createFilterPlugins } from "~/operations/entry/elasticsearch/filtering/plugins/index.js";
import { CmsEntryFilterPlugin } from "~/plugins/CmsEntryFilterPlugin.js";
import { StorageOperationsCmsModelPlugin, StorageTransformPlugin } from "@webiny/api-headless-cms";
import { createCreateIndexTask } from "~/tasks/createIndexTaskPlugin.js";
import { CompressorPlugin } from "@webiny/api";
import { ModelAfterCreateHandler } from "@webiny/api-headless-cms/features/contentModel/CreateModel/index.js";
import { ModelAfterCreateFromHandler } from "@webiny/api-headless-cms/features/contentModel/CreateModelFrom/events.js";
import { ModelAfterDeleteHandler } from "@webiny/api-headless-cms/features/contentModel/DeleteModel/events.js";
import { createTable } from "@webiny/db-dynamodb";

export * from "./plugins/index.js";

export const createStorageOperations: StorageOperationsFactory = params => {
    const { table, esTable, documentClient, elasticsearch, plugins: userPlugins } = params;

    const tableInstance = createTable({
        name: table || (process.env.DB_TABLE as string),
        documentClient
    });
    const tableElasticsearchInstance = createElasticsearchTable({
        name: esTable,
        documentClient
    });

    const entities = {
        groups: createGroupEntity({
            entityName: ENTITIES.GROUPS,
            table: tableInstance
        }),
        models: createModelEntity({
            entityName: ENTITIES.MODELS,
            table: tableInstance
        }),
        entries: createEntryEntity({
            entityName: ENTITIES.ENTRIES,
            table: tableInstance
        }),
        entriesEs: createElasticsearchEntity({
            entityName: ENTITIES.ENTRIES_ES,
            table: tableElasticsearchInstance
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
            context.db.registry.register({
                item: entities.entries,
                app: "cms",
                tags: ["regular", entities.entries.name]
            });
            context.db.registry.register({
                item: entities.entriesEs,
                app: "cms",
                tags: ["es", entities.entriesEs.name]
            });
            /**
             * Attach the elasticsearch into context if it is not already attached.
             */
            if (!context.elasticsearch) {
                context.elasticsearch = elasticsearch;
            }

            /**
             * This registers the task implementation
             */
            createCreateIndexTask(context);

            /**
             * Pass the plugins to the parent context.
             */
            context.plugins.register([dynamoDbPlugins(), elasticsearchIndexPlugins()]);
            /**
             * We need to fetch all the plugin types in the list from the main container.
             * This way we do not need to register plugins in the storage plugins contains.
             */
            const types: string[] = [
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
                CmsEntryElasticsearchValuesModifier.type,
                CompressorPlugin.type
            ];
            for (const type of types) {
                plugins.mergeByType(context.plugins, type);
            }
            entries.dataLoaders.clearAll();
        },
        init: async context => {
            /**
             * TODO @pavel
             * Moved operations to AFTER create/from because at in before the model does not have modelId - to create the index.
             */
            context.container.registerFactory(ModelAfterCreateHandler, () => ({
                async handle(event) {
                    const { model } = event.payload;
                    await createElasticsearchIndex({
                        client: elasticsearch,
                        model,
                        plugins
                    });
                }
            }));

            context.container.registerFactory(ModelAfterCreateFromHandler, () => ({
                async handle(event) {
                    const { model } = event.payload;
                    await createElasticsearchIndex({
                        client: elasticsearch,
                        model,
                        plugins
                    });
                }
            }));

            context.container.registerFactory(ModelAfterDeleteHandler, () => ({
                async handle(event) {
                    const { model } = event.payload;
                    await deleteElasticsearchIndex({
                        client: elasticsearch,
                        model
                    });
                }
            }));
        },
        getEntities: () => entities,
        getTable: () => tableInstance,
        getEsTable: () => tableElasticsearchInstance,
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
