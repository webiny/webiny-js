import type { CmsContext } from "~/types.js";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types/index.js";
import { createFeature } from "@webiny/feature/api/index.js";
import { StorageOperationsFactory as StorageOperationsFactoryAbstraction } from "@webiny/api-headless-cms/exports/api/cms/storage.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { KnexClient } from "@webiny/api-core-sql";
import {
    CmsEntryOpenSearchFieldIndexFeature,
    CmsEntryOpenSearchFieldIndexRegistry
} from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchFieldIndex/index.js";
import {
    CmsEntryOpenSearchFilterFeature,
    CmsEntryOpenSearchFilterRegistry
} from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchFilter/index.js";
import { CmsEntryOpenSearchIndexFeature } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchIndex/index.js";
import {
    CmsEntryOpenSearchValueSearchFeature,
    CmsEntryOpenSearchValueSearchRegistry
} from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchValueSearch/index.js";
import { CmsEntryOpenSearchBodyModifier } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchBodyModifier/index.js";
import { CmsEntryOpenSearchSortModifier } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchSortModifier/index.js";
import { CmsEntryOpenSearchQueryModifier } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchQueryModifier/index.js";
import { CmsEntryOpenSearchFullTextSearch } from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchFullTextSearch/index.js";
import {
    CmsEntryOpenSearchIndexCreate,
    CmsEntryOpenSearchIndexCreateFeature
} from "@webiny/api-headless-cms-utils-os/features/CmsEntryOpenSearchIndexCreate/index.js";
import { deleteElasticsearchIndex } from "@webiny/api-headless-cms-utils-os/elasticsearch/deleteElasticsearchIndex.js";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import { ModelAfterCreateEventHandler } from "@webiny/api-headless-cms/features/contentModel/CreateModel/index.js";
import { ModelAfterCreateFromEventHandler } from "@webiny/api-headless-cms/features/contentModel/CreateModelFrom/events.js";
import { ModelAfterDeleteEventHandler } from "@webiny/api-headless-cms/features/contentModel/DeleteModel/events.js";
import {
    OpenSearchClient,
    OpenSearchFieldFactory,
    OpenSearchQueryBuilderOperatorRegistry
} from "@webiny/api-opensearch/exports/api/opensearch.js";
import {
    TableNameResolverConfig,
    TableNameResolver
} from "@webiny/api-headless-cms-sql/features/tableNameResolver/abstractions.js";
import { TableNameResolverFeature } from "@webiny/api-headless-cms-sql/features/tableNameResolver/feature.js";
import { ValueFilterFeature } from "@webiny/db-utils";
import { GroupSchemaManagerFeature } from "@webiny/api-headless-cms-sql/features/groupSchemaManager/feature.js";
import { ModelSchemaManagerFeature } from "@webiny/api-headless-cms-sql/features/modelSchemaManager/feature.js";
import { EntryTableManagerFeature } from "@webiny/api-headless-cms-sql/features/entryTableManager/feature.js";
import { GroupSchemaManager } from "@webiny/api-headless-cms-sql/features/groupSchemaManager/abstractions.js";
import { ModelSchemaManager } from "@webiny/api-headless-cms-sql/features/modelSchemaManager/abstractions.js";
import { EntryTableManager } from "@webiny/api-headless-cms-sql/features/entryTableManager/abstractions.js";
import { SyncTableManagerFeature } from "./syncTableManager/feature.js";
import { SyncTableManager } from "./syncTableManager/abstractions.js";
import { createEntriesStorageOperations } from "~/operations/entry/index.js";
import { createGroupsStorageOperations } from "~/operations/group/index.js";
import { createModelsStorageOperations } from "~/operations/model/index.js";
import {
    createFilterCreatePlugins,
    createPlainObjectPathPlugin,
    createLocationFolderIdPathPlugin,
    createDatetimeTransformValuePlugin
} from "@webiny/api-headless-cms-storage";

interface PgOsStorageOperationsFactoryParams {
    elasticsearch: ReturnType<OpenSearchClient.Interface["use"]>;
    plugins: any;
    container: CmsContext["container"];
}

const createPgOsStorageOperations = (
    params: PgOsStorageOperationsFactoryParams
): HeadlessCmsStorageOperations => {
    const { elasticsearch, container, plugins } = params;

    const knex = container.resolve(KnexClient);
    const tableNameResolver = container.resolve(TableNameResolver);
    const groupSchemaManager = container.resolve(GroupSchemaManager);
    const modelSchemaManager = container.resolve(ModelSchemaManager);
    const entryTableManager = container.resolve(EntryTableManager);
    const syncTableManager = container.resolve(SyncTableManager);

    const fieldRegistry = container.resolve(CmsModelFieldToGraphQLRegistry);
    const fieldIndexRegistry = container.resolve(CmsEntryOpenSearchFieldIndexRegistry);
    const compressionHandler = container.resolve(CompressionHandler);
    const bodyModifiers = container.resolveAll(CmsEntryOpenSearchBodyModifier);
    const sortModifiers = container.resolveAll(CmsEntryOpenSearchSortModifier);
    const queryModifiers = container.resolveAll(CmsEntryOpenSearchQueryModifier);
    const valueSearchRegistry = container.resolve(CmsEntryOpenSearchValueSearchRegistry);
    const fullTextSearches = container.resolveAll(CmsEntryOpenSearchFullTextSearch);
    const filterRegistry = container.resolve(CmsEntryOpenSearchFilterRegistry);
    const operatorRegistry = container.resolve(OpenSearchQueryBuilderOperatorRegistry);
    const fieldFactory = container.resolve(OpenSearchFieldFactory);

    plugins.register([
        createFilterCreatePlugins(),
        createPlainObjectPathPlugin(),
        createLocationFolderIdPathPlugin(),
        createDatetimeTransformValuePlugin()
    ]);

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

    container.registerFactory(ModelAfterDeleteEventHandler, () => ({
        async handle(event) {
            const { model } = event.payload;
            await deleteElasticsearchIndex({
                client: elasticsearch,
                model
            });
        }
    }));

    const groups = createGroupsStorageOperations(
        knex.client,
        tableNameResolver,
        groupSchemaManager
    );
    const models = createModelsStorageOperations(
        knex.client,
        tableNameResolver,
        modelSchemaManager
    );
    const entries = createEntriesStorageOperations({
        knex: knex.client,
        container,
        plugins,
        elasticsearch,
        entryTableManager,
        syncTableManager,
        fieldRegistry,
        fieldIndexRegistry,
        filterRegistry,
        compressionHandler,
        bodyModifiers,
        sortModifiers,
        queryModifiers,
        valueSearchRegistry,
        fullTextSearches,
        operatorRegistry,
        fieldFactory
    });

    return {
        name: "postgresql:opensearch",
        beforeInit: () => {},
        groups,
        models,
        entries
    };
};

class PgOsStorageOperationsFactoryImpl implements StorageOperationsFactoryAbstraction.Interface {
    public constructor(private readonly openSearchClient: OpenSearchClient.Interface) {}

    public create(context: CmsContext) {
        return createPgOsStorageOperations({
            elasticsearch: this.openSearchClient.use(),
            plugins: context.plugins,
            container: context.container
        });
    }
}

const PgOsStorageOperationsFactory = StorageOperationsFactoryAbstraction.createImplementation({
    implementation: PgOsStorageOperationsFactoryImpl,
    dependencies: [OpenSearchClient]
});

export interface IPgOsStorageOperationsConfig {
    knex: any;
    tableNamePrefix?: string;
    tableNameSuffix?: string;
}

export const HeadlessCmsPgOsFeature = createFeature({
    name: "cms.storageOperations.pgOs",
    register: container => {
        CmsEntryOpenSearchFieldIndexFeature.register(container);
        CmsEntryOpenSearchFilterFeature.register(container);
        CmsEntryOpenSearchIndexFeature.register(container);
        CmsEntryOpenSearchIndexCreateFeature.register(container);
        CmsEntryOpenSearchValueSearchFeature.register(container);
        container.register(PgOsStorageOperationsFactory).inSingletonScope();
    }
});

export const registerPgOsStorageOperations = (config: IPgOsStorageOperationsConfig) => {
    const storageOperationsFeature = createFeature({
        name: "cms.storageOperations.pgOs.registration",
        register: container => {
            const sharedTables = process.env.WEBINY_SHARED_TABLES === "true";

            container.registerInstance(TableNameResolverConfig, {
                sharedTables,
                tableNamePrefix: config.tableNamePrefix,
                tableNameSuffix: config.tableNameSuffix
            });

            TableNameResolverFeature.register(container);
            ValueFilterFeature.register(container);
            GroupSchemaManagerFeature.register(container);
            ModelSchemaManagerFeature.register(container);
            EntryTableManagerFeature.register(container);
            SyncTableManagerFeature.register(container);

            HeadlessCmsPgOsFeature.register(container);
        }
    });

    const plugin = createRegisterExtensionPlugin(context => {
        return storageOperationsFeature.register(context.container);
    });

    plugin.name = "cms.registerPgOsStorageOperations";

    return [plugin];
};
