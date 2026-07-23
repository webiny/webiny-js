import type { CmsContext } from "~/types.js";
import type { HeadlessCmsStorageOperations } from "@webiny/api-headless-cms/types/index.js";
import { createFeature } from "@webiny/feature/api/index.js";
import { StorageOperationsFactory as StorageOperationsFactoryAbstraction } from "@webiny/api-headless-cms/exports/api/cms/storage.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { KnexClient } from "@webiny/api-core-sql";
import { SqlEntryOperationsFeature } from "@webiny/api-headless-cms-sql/operations/entry/feature.js";
import { CmsEntryOpenSearchUtilsFeature } from "@webiny/api-headless-cms-utils-os";
import {
    CmsEntryOpenSearchIndexCreate,
    CmsEntryOpenSearchIndexDelete
} from "@webiny/api-headless-cms-utils-os/exports/api/cms/opensearch.js";
import { ModelAfterCreateEventHandler } from "@webiny/api-headless-cms/features/contentModel/CreateModel/index.js";
import { ModelAfterCreateFromEventHandler } from "@webiny/api-headless-cms/features/contentModel/CreateModelFrom/events.js";
import { ModelAfterDeleteEventHandler } from "@webiny/api-headless-cms/features/contentModel/DeleteModel/events.js";
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
import { SyncTableManagerFeature } from "./syncTableManager/feature.js";
import { SyncWriterFeature } from "./SyncWriter/feature.js";
import { EntryOperationsFeature } from "~/operations/entry/feature.js";
import { createEntriesStorageOperations } from "~/operations/entry/index.js";
import { createGroupsStorageOperations } from "~/operations/group/index.js";
import { createModelsStorageOperations } from "~/operations/model/index.js";
import { FilterRegistriesFeature } from "@webiny/api-headless-cms-storage";

const createPgOsStorageOperations = (
    container: CmsContext["container"]
): HeadlessCmsStorageOperations => {
    const knex = container.resolve(KnexClient);
    const tableNameResolver = container.resolve(TableNameResolver);
    const groupSchemaManager = container.resolve(GroupSchemaManager);
    const modelSchemaManager = container.resolve(ModelSchemaManager);

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
    const entries = createEntriesStorageOperations(container);

    return {
        name: "postgresql:opensearch",
        beforeInit: () => {},
        groups,
        models,
        entries
    };
};

class PgOsStorageOperationsFactoryImpl implements StorageOperationsFactoryAbstraction.Interface {
    public create(context: CmsContext) {
        return createPgOsStorageOperations(context.container);
    }
}

const PgOsStorageOperationsFactory = StorageOperationsFactoryAbstraction.createImplementation({
    implementation: PgOsStorageOperationsFactoryImpl,
    dependencies: []
});

export interface IPgOsStorageOperationsConfig {
    knex: any;
    tableNamePrefix?: string;
    tableNameSuffix?: string;
}

export const HeadlessCmsPgOsFeature = createFeature({
    name: "cms.storageOperations.pgOs",
    register: container => {
        CmsEntryOpenSearchUtilsFeature.register(container);
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
            FilterRegistriesFeature.register(container);
            GroupSchemaManagerFeature.register(container);
            ModelSchemaManagerFeature.register(container);
            EntryTableManagerFeature.register(container);
            SqlEntryOperationsFeature.register(container);
            SyncTableManagerFeature.register(container);
            SyncWriterFeature.register(container);
            EntryOperationsFeature.register(container);

            HeadlessCmsPgOsFeature.register(container);
        }
    });

    const plugin = createRegisterExtensionPlugin(context => {
        return storageOperationsFeature.register(context.container);
    });

    plugin.name = "cms.registerPgOsStorageOperations";

    return [plugin];
};
