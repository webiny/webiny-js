import type { Container } from "@webiny/di";
import { createFeature } from "@webiny/feature/api/index.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { CmsEntryOpenSearchUtilsFeature } from "@webiny/api-headless-cms-utils-os";
import {
    CmsEntryOpenSearchIndexCreate,
    CmsEntryOpenSearchIndexDelete
} from "@webiny/api-headless-cms-utils-os/exports/api/cms/opensearch.js";
import { ModelAfterCreateEventHandler } from "@webiny/api-headless-cms/features/contentModel/CreateModel/index.js";
import { ModelAfterCreateFromEventHandler } from "@webiny/api-headless-cms/features/contentModel/CreateModelFrom/events.js";
import { ModelAfterDeleteEventHandler } from "@webiny/api-headless-cms/features/contentModel/DeleteModel/events.js";
import { TableNameResolverConfig } from "@webiny/api-headless-cms-sql/features/tableNameResolver/abstractions.js";
import { TableNameResolverFeature } from "@webiny/api-headless-cms-sql/features/tableNameResolver/feature.js";
import { ValueFilterFeature } from "@webiny/db-utils";
import { GroupSchemaManagerFeature } from "@webiny/api-headless-cms-sql/features/groupSchemaManager/feature.js";
import { ModelSchemaManagerFeature } from "@webiny/api-headless-cms-sql/features/modelSchemaManager/feature.js";
import { EntryTableManagerFeature } from "@webiny/api-headless-cms-sql/features/entryTableManager/feature.js";
import { SyncTableManagerFeature } from "./syncTableManager/feature.js";
import { SyncWriterFeature } from "./SyncWriter/feature.js";
import { FilterRegistriesFeature } from "@webiny/api-headless-cms-storage";
import { SqlGroupStorageOperations } from "@webiny/api-headless-cms-sql/operations/group/SqlGroupStorageOperations.js";
import { SqlModelStorageOperations } from "@webiny/api-headless-cms-sql/operations/model/SqlModelStorageOperations.js";
import { PgOsEntryStorageOpsFeature } from "~/PgOsEntryStorageOpsFeature.js";

export interface IPgOsStorageOperationsConfig {
    knex: any;
    tableNamePrefix?: string;
    tableNameSuffix?: string;
}

export const HeadlessCmsPgOsFeature = createFeature({
    name: "cms.storageOperations.pgOs",
    register: container => {
        CmsEntryOpenSearchUtilsFeature.register(container);

        // Event handlers for OpenSearch index lifecycle
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

        // Group + model: reuse SQL DI classes, app-scoped singletons
        container.register(SqlGroupStorageOperations).inSingletonScope();
        container.register(SqlModelStorageOperations).inSingletonScope();

        // Entry ops: 22 per-method DI classes — write decorators + search impls + SQL reuse
        PgOsEntryStorageOpsFeature.register(container);
    }
});

export const registerPgOsStorageOperations = (config: IPgOsStorageOperationsConfig) => {
    const storageOperationsFeature = createFeature({
        name: "cms.storageOperations.pgOs.registration",
        register: (container: Container) => {
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
            SyncTableManagerFeature.register(container);
            SyncWriterFeature.register(container);

            HeadlessCmsPgOsFeature.register(container);
        }
    });

    const plugin = createRegisterExtensionPlugin(context => {
        return storageOperationsFeature.register(context.container);
    });

    plugin.name = "cms.registerPgOsStorageOperations";

    return [plugin];
};
