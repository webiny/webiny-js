import { createTable, DynamoDBClient } from "@webiny/db-dynamodb";
import { StorageOperationsFactory as StorageOperationsFactoryAbstraction } from "@webiny/api-headless-cms/exports/api/cms/storage.js";
import type { CmsContext, StorageOperationsFactory as IStorageOperationsFactory } from "~/types.js";
import { ENTITIES } from "~/types.js";
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
import { DbRegistry } from "@webiny/db/exports/api/db.js";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import { CreateElasticsearchIndexTask } from "~/tasks/CreateElasticsearchIndexTask.js";

const createOpenSearchStorageOperations: IStorageOperationsFactory = params => {
    const { table, esTable, elasticsearch, plugins, container } = params;

    const db = container.resolve(DynamoDBClient);
    const documentClient = db.client;

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
            const dbRegistry = context.container.resolve(DbRegistry);

            dbRegistry.register({
                item: entities.entries,
                app: "cms",
                tags: ["regular", entities.entries.name]
            });
            dbRegistry.register({
                item: entities.entriesEs,
                app: "cms",
                tags: ["es", entities.entriesEs.name]
            });

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
    public constructor(private readonly openSearchClient: OpenSearchClient.Interface) {}

    public async create(context: CmsContext) {
        return createOpenSearchStorageOperations({
            elasticsearch: this.openSearchClient.use(),
            plugins: context.plugins,
            container: context.container
        });
    }
}

const OpenSearchStorageOperationsFactory = StorageOperationsFactoryAbstraction.createImplementation(
    {
        implementation: OpenSearchStorageOperationsFactoryImpl,
        dependencies: [OpenSearchClient]
    }
);

const storageOperationsFeature = createFeature({
    name: "cms.storageOperations.openSearch",
    register: container => {
        CmsEntryOpenSearchFieldIndexFeature.register(container);
        CmsEntryOpenSearchFilterFeature.register(container);
        CmsEntryOpenSearchIndexFeature.register(container);
        CmsEntryOpenSearchValueSearchFeature.register(container);
        container.register(CreateElasticsearchIndexTask);
        container.register(OpenSearchStorageOperationsFactory).inSingletonScope();
    }
});

export const registerCmsOpenSearchStorageOperations = () => {
    const plugin = createRegisterExtensionPlugin(context => {
        return storageOperationsFeature.register(context.container);
    });

    plugin.name = "cms.registerOpenSearchStorageOperations";

    return [plugin];
};
