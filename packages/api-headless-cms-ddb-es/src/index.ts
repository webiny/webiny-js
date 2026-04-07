import dynamoDbValueFilters from "@webiny/db-dynamodb/plugins/filters/index.js";
import elasticsearchPlugins from "./elasticsearch/index.js";
import dynamoDbPlugins from "./dynamoDb/index.js";
import { createModelsStorageOperations } from "./operations/model/index.js";
import { createEntriesStorageOperations } from "./operations/entry/index.js";
import { StorageOperationsFactory as StorageOperationsFactoryAbstraction } from "@webiny/api-headless-cms/exports/api/cms/storage.js";
import type { StorageOperationsFactory as IStorageOperationsFactory } from "~/types.js";
import { type CmsContext, ENTITIES } from "~/types.js";
import { createGroupEntity } from "~/definitions/group.js";
import { createModelEntity } from "~/definitions/model.js";
import { createEntryEntity } from "~/definitions/entry.js";
import { createElasticsearchIndex } from "~/elasticsearch/createElasticsearchIndex.js";
import { createGroupsStorageOperations } from "~/operations/group/index.js";
import { createOpenSearchEntity, createOpenSearchTable } from "@webiny/api-opensearch";
import { elasticsearchIndexPlugins } from "./elasticsearch/indices/index.js";
import { deleteElasticsearchIndex } from "./elasticsearch/deleteElasticsearchIndex.js";
import { createFilterPlugins } from "~/operations/entry/elasticsearch/filtering/plugins/index.js";
import { createCreateIndexTask } from "~/tasks/createIndexTaskPlugin.js";
import { ModelAfterCreateEventHandler } from "@webiny/api-headless-cms/features/contentModel/CreateModel/index.js";
import { ModelAfterCreateFromEventHandler } from "@webiny/api-headless-cms/features/contentModel/CreateModelFrom/events.js";
import { ModelAfterDeleteEventHandler } from "@webiny/api-headless-cms/features/contentModel/DeleteModel/events.js";
import { createTable } from "@webiny/db-dynamodb";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { createFeature } from "@webiny/feature/api/index.js";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";

export * from "./plugins/index.js";

export const createOpenSearchStorageOperations: IStorageOperationsFactory = params => {
    const { table, esTable, documentClient, elasticsearch, plugins, getContainer } = params;

    const tableInstance = createTable({
        name: table || (process.env.DB_TABLE as string),
        documentClient
    });
    const tableElasticsearchInstance = createOpenSearchTable({
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
        entriesEs: createOpenSearchEntity({
            entityName: ENTITIES.ENTRIES_ES,
            table: tableElasticsearchInstance
        })
    };

    plugins.register([
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
        createFilterPlugins()
        /**
         * User defined custom plugins.
         * They are at the end because we can then override existing plugins.
         */
    ]);

    const fieldRegistry = getContainer().resolve(CmsModelFieldToGraphQLRegistry);

    const entries = createEntriesStorageOperations({
        entity: entities.entries,
        esEntity: entities.entriesEs,
        plugins,
        elasticsearch,
        fieldRegistry
    });

    return {
        name: "dynamodb:opensearch",
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
            // TODO we know that context is ok, but types are missing elasticsearch/opensearch
            // @ts-expect-error
            createCreateIndexTask(context);

            entries.dataLoaders.clearAll();
        },
        init: async context => {
            /**
             * TODO @pavel
             * Moved operations to AFTER create/from because at in before the model does not have modelId - to create the index.
             */
            context.container.registerFactory(ModelAfterCreateEventHandler, () => ({
                async handle(event) {
                    const { model } = event.payload;
                    await createElasticsearchIndex({
                        client: elasticsearch,
                        model,
                        plugins
                    });
                }
            }));

            context.container.registerFactory(ModelAfterCreateFromEventHandler, () => ({
                async handle(event) {
                    const { model } = event.payload;
                    await createElasticsearchIndex({
                        client: elasticsearch,
                        model,
                        plugins
                    });
                }
            }));

            context.container.registerFactory(ModelAfterDeleteEventHandler, () => ({
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

class OpenSearchStorageOperationsFactoryImpl
    implements StorageOperationsFactoryAbstraction.Interface
{
    public async create(context: CmsContext) {
        return createOpenSearchStorageOperations({
            documentClient: context.db.driver.getClient() as DynamoDBDocument,
            elasticsearch: context.opensearch,
            plugins: context.plugins,
            getContainer: () => {
                return context.container;
            }
        });
    }
}

const OpenSearchStorageOperationsFactory = StorageOperationsFactoryAbstraction.createImplementation(
    {
        implementation: OpenSearchStorageOperationsFactoryImpl,
        dependencies: []
    }
);

const storageOperationsFeature = createFeature({
    name: "cms.storageOperations.openSearch",
    register: container => {
        container.register(OpenSearchStorageOperationsFactory).inSingletonScope();
    }
});

export const registerCmsOpenSearchStorageOperations = () => {
    return createRegisterExtensionPlugin(context => {
        return storageOperationsFeature.register(context.container);
    });
};
