import { createTable, registerExtension as registerDynamoDbExtension } from "@webiny/db-dynamodb";
import { StorageOperationsFactory as StorageOperationsFactoryAbstraction } from "@webiny/api-headless-cms/exports/api/cms/storage.js";
import type { CmsContext, StorageOperationsFactory as IStorageOperationsFactory } from "~/types.js";
import { ENTITIES } from "~/types.js";
import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { createFeature } from "@webiny/feature/api/index.js";
import {
    CmsEntryOpenSearchValueSearchFeature,
    CmsEntryOpenSearchValueSearchRegistry
} from "~/features/CmsEntryOpenSearchValueSearch/index.js";
import {
    CmsEntryOpenSearchIndex,
    CmsEntryOpenSearchIndexFeature
} from "~/features/CmsEntryOpenSearchIndex/index.js";
import { createModelsStorageOperations } from "./operations/model/index.js";
import { createEntriesStorageOperations } from "./operations/entry/index.js";
import { createGroupEntity } from "~/definitions/group.js";
import { createModelEntity } from "~/definitions/model.js";
import { createEntryEntity } from "~/definitions/entry.js";
import { createElasticsearchIndex } from "~/elasticsearch/createElasticsearchIndex.js";
import { createGroupsStorageOperations } from "~/operations/group/index.js";
import { createOpenSearchEntity, createOpenSearchTable } from "@webiny/api-opensearch";
import { deleteElasticsearchIndex } from "./elasticsearch/deleteElasticsearchIndex.js";
import { createCreateIndexTask } from "~/tasks/createIndexTaskPlugin.js";
import { ModelAfterCreateEventHandler } from "@webiny/api-headless-cms/features/contentModel/CreateModel/index.js";
import { ModelAfterCreateFromEventHandler } from "@webiny/api-headless-cms/features/contentModel/CreateModelFrom/events.js";
import { ModelAfterDeleteEventHandler } from "@webiny/api-headless-cms/features/contentModel/DeleteModel/events.js";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import { CmsEntryOpenSearchBodyModifier } from "~/features/CmsEntryOpenSearchBodyModifier/index.js";
import { CmsEntryOpenSearchSortModifier } from "~/features/CmsEntryOpenSearchSortModifier/index.js";
import { CmsEntryOpenSearchQueryModifier } from "~/features/CmsEntryOpenSearchQueryModifier/index.js";
import { CmsEntryOpenSearchFullTextSearch } from "~/features/CmsEntryOpenSearchFullTextSearch/index.js";
import { CmsEntryOpenSearchValuesModifier } from "~/features/CmsEntryOpenSearchValuesModifier/index.js";
import {
    CmsEntryOpenSearchFieldIndexFeature,
    CmsEntryOpenSearchFieldIndexRegistry
} from "~/features/CmsEntryOpenSearchFieldIndex/index.js";
import {
    CmsEntryOpenSearchFilterFeature,
    CmsEntryOpenSearchFilterRegistry
} from "~/features/CmsEntryOpenSearchFilter/index.js";

const createOpenSearchStorageOperations: IStorageOperationsFactory = params => {
    const { table, esTable, documentClient, elasticsearch, plugins, container } = params;

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

    const fieldRegistry = container.resolve(CmsModelFieldToGraphQLRegistry);
    const fieldIndexRegistry = container.resolve(CmsEntryOpenSearchFieldIndexRegistry);
    const compressionHandler = container.resolve(CompressionHandler);
    const bodyModifiers = container.resolveAll(CmsEntryOpenSearchBodyModifier);
    const sortModifiers = container.resolveAll(CmsEntryOpenSearchSortModifier);
    const queryModifiers = container.resolveAll(CmsEntryOpenSearchQueryModifier);
    const valueSearchRegistry = container.resolve(CmsEntryOpenSearchValueSearchRegistry);
    const fullTextSearches = container.resolveAll(CmsEntryOpenSearchFullTextSearch);
    const valuesModifiers = container.resolveAll(CmsEntryOpenSearchValuesModifier);
    const filterRegistry = container.resolve(CmsEntryOpenSearchFilterRegistry);

    container.registerFactory(ModelAfterCreateEventHandler, () => ({
        async handle(event) {
            const { model } = event.payload;
            await createElasticsearchIndex({
                client: elasticsearch,
                model,
                indexConfigs: container.resolveAll(CmsEntryOpenSearchIndex)
            });
        }
    }));

    container.registerFactory(ModelAfterCreateFromEventHandler, () => ({
        async handle(event) {
            const { model } = event.payload;
            await createElasticsearchIndex({
                client: elasticsearch,
                model,
                indexConfigs: container.resolveAll(CmsEntryOpenSearchIndex)
            });
        }
    }));

    container.registerFactory(ModelAfterDeleteEventHandler, () => ({
        async handle(event) {
            const { model } = event.payload;
            await deleteElasticsearchIndex({
                client: elasticsearch,
                model
            });
        }
    }));

    const entries = createEntriesStorageOperations({
        entity: entities.entries,
        esEntity: entities.entriesEs,
        plugins,
        elasticsearch,
        fieldRegistry,
        fieldIndexRegistry,
        compressionHandler,
        bodyModifiers,
        sortModifiers,
        queryModifiers,
        valueSearchRegistry,
        fullTextSearches,
        valuesModifiers,
        filterRegistry
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
        getEntities: () => entities,
        getTable: () => tableInstance,
        getEsTable: () => tableElasticsearchInstance,
        groups: createGroupsStorageOperations({
            entity: entities.groups,
            container
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
            container: context.container
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
        CmsEntryOpenSearchFieldIndexFeature.register(container);
        CmsEntryOpenSearchFilterFeature.register(container);
        CmsEntryOpenSearchIndexFeature.register(container);
        CmsEntryOpenSearchValueSearchFeature.register(container);
        container.register(OpenSearchStorageOperationsFactory).inSingletonScope();
    }
});

export const registerCmsOpenSearchStorageOperations = () => {
    return [
        registerDynamoDbExtension(),
        createRegisterExtensionPlugin(context => {
            return storageOperationsFeature.register(context.container);
        })
    ];
};
