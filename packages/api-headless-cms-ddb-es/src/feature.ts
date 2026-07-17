import { createTable, DynamoDBClient } from "@webiny/db-dynamodb";
import { StorageOperationsFactory as StorageOperationsFactoryAbstraction } from "@webiny/api-headless-cms/exports/api/cms/storage.js";
import type { CmsContext, StorageOperationsFactory as IStorageOperationsFactory } from "~/types.js";
import { ENTITIES } from "~/types.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { createFeature } from "@webiny/feature/api/index.js";
import { CmsEntryOpenSearchValueSearchFeature } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchValueSearch/index.js";
import { CmsEntryOpenSearchIndexFeature } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchIndex/index.js";
import { createModelsStorageOperations } from "./operations/model/index.js";
import { createEntriesStorageOperations } from "./operations/entry/index.js";
import { createGroupEntity } from "~/definitions/group.js";
import { createModelEntity } from "~/definitions/model.js";
import { createEntryEntity } from "~/definitions/entry.js";
import {
    CmsEntryOpenSearchIndexCreate,
    CmsEntryOpenSearchIndexCreateFeature
} from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchIndexCreate/index.js";
import { createGroupsStorageOperations } from "~/operations/group/index.js";
import { createOpenSearchEntity, createOpenSearchTable } from "@webiny/api-opensearch";
import {
    CmsEntryOpenSearchIndexDelete,
    CmsEntryOpenSearchIndexDeleteFeature
} from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchIndexDelete/index.js";
import { CmsEntryOpenSearchBodyBuilderFeature } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchBodyBuilder/index.js";
import { CmsEntryOpenSearchExecFilteringFeature } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchExecFiltering/index.js";
import { CmsEntryOpenSearchFieldPathFactoryFeature } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchFieldPathFactory/index.js";
import { CmsEntryOpenSearchValueTransformerFeature } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchValueTransformer/index.js";
import { CmsEntryOpenSearchOperatorListFeature } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchOperatorList/index.js";
import { ModelAfterCreateEventHandler } from "@webiny/api-headless-cms/features/contentModel/CreateModel/index.js";
import { ModelAfterCreateFromEventHandler } from "@webiny/api-headless-cms/features/contentModel/CreateModelFrom/events.js";
import { ModelAfterDeleteEventHandler } from "@webiny/api-headless-cms/features/contentModel/DeleteModel/events.js";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import { CmsEntryOpenSearchValuesModifier } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchValuesModifier/index.js";
import {
    CmsEntryOpenSearchFieldIndexFeature,
    CmsEntryOpenSearchFieldIndexRegistry
} from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchFieldIndex/index.js";
import { CmsEntryOpenSearchFilterFeature } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchFilter/index.js";
import { DbRegistry } from "@webiny/db/exports/api/db.js";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import { CreateElasticsearchIndexTask } from "~/tasks/CreateElasticsearchIndexTask.js";

const createOpenSearchStorageOperations: IStorageOperationsFactory = params => {
    const { table, esTable, elasticsearch, container } = params;

    const db = container.resolve(DynamoDBClient);
    const documentClient = db.client;

    const tableInstance = createTable({
        name: table || (process.env.DB_TABLE as string),
        documentClient
    });
    const tableElasticsearchInstance = createOpenSearchTable({
        name: esTable || (process.env.DB_TABLE_OPENSEARCH as string),
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
    const valuesModifiers = container.resolveAll(CmsEntryOpenSearchValuesModifier);

    const indexCreate = container.resolve(CmsEntryOpenSearchIndexCreate);

    container.registerFactory(ModelAfterCreateEventHandler, () => ({
        async handle(event) {
            const { model } = event.payload;
            await indexCreate.execute({ model });
        }
    }));

    container.registerFactory(ModelAfterCreateFromEventHandler, () => ({
        async handle(event) {
            const { model } = event.payload;
            await indexCreate.execute({ model });
        }
    }));

    const indexDelete = container.resolve(CmsEntryOpenSearchIndexDelete);

    container.registerFactory(ModelAfterDeleteEventHandler, () => ({
        async handle(event) {
            const { model } = event.payload;
            await indexDelete.execute({ model });
        }
    }));

    const entries = createEntriesStorageOperations({
        entity: entities.entries,
        esEntity: entities.entriesEs,
        container,
        elasticsearch,
        fieldRegistry,
        fieldIndexRegistry,
        compressionHandler,
        valuesModifiers
    });

    return {
        name: "dynamodb:opensearch",
        beforeInit: context => {
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

    public create(context: CmsContext) {
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

/**
 * DI-native feature — registers the DynamoDB+OpenSearch CMS storage operations factory (parallel to
 * HeadlessCmsDdbFeature). Requires DynamoDBClient (DbFeature) and OpenSearchClient
 * (OpenSearchClientFeature) to be registered in the container first.
 */
export const HeadlessCmsDdbEsFeature = createFeature({
    name: "cms.storageOperations.openSearch",
    register: container => {
        CmsEntryOpenSearchFieldIndexFeature.register(container);
        CmsEntryOpenSearchFilterFeature.register(container);
        CmsEntryOpenSearchIndexFeature.register(container);
        CmsEntryOpenSearchIndexCreateFeature.register(container);
        CmsEntryOpenSearchIndexDeleteFeature.register(container);
        CmsEntryOpenSearchFieldPathFactoryFeature.register(container);
        CmsEntryOpenSearchValueTransformerFeature.register(container);
        CmsEntryOpenSearchOperatorListFeature.register(container);
        CmsEntryOpenSearchExecFilteringFeature.register(container);
        CmsEntryOpenSearchBodyBuilderFeature.register(container);
        CmsEntryOpenSearchValueSearchFeature.register(container);
        container.register(CreateElasticsearchIndexTask);
        container.register(OpenSearchStorageOperationsFactory).inSingletonScope();
    }
});

export const registerCmsOpenSearchStorageOperations = () => {
    const plugin = createRegisterExtensionPlugin(context => {
        return HeadlessCmsDdbEsFeature.register(context.container);
    });

    plugin.name = "cms.registerOpenSearchStorageOperations";

    return [plugin];
};
