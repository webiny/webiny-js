import type { Container } from "@webiny/di";
import { createFeature } from "@webiny/feature/api/index.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { CmsEntryOpenSearchUtilsFeature } from "@webiny/api-headless-cms-utils-os";
import { TableNameResolverConfig } from "@webiny/api-headless-cms-sql/features/tableNameResolver/abstractions.js";
import { TableNameResolverFeature } from "@webiny/api-headless-cms-sql/features/tableNameResolver/feature.js";
import { ValueFilterFeature } from "@webiny/db-utils";
import { GroupSchemaManagerFeature } from "@webiny/api-headless-cms-sql/features/groupSchemaManager/feature.js";
import { ModelSchemaManagerFeature } from "@webiny/api-headless-cms-sql/features/modelSchemaManager/feature.js";
import { EntryTableManagerFeature } from "@webiny/api-headless-cms-sql/features/entryTableManager/feature.js";
import { SyncTableManagerFeature } from "./syncTableManager/feature.js";
import { SyncWriterFeature } from "./SyncWriter/feature.js";
import { FilterRegistriesFeature } from "@webiny/api-headless-cms-storage";
import { SqlGetGroup } from "@webiny/api-headless-cms-sql/operations/group/SqlGetGroup.js";
import { SqlListGroups } from "@webiny/api-headless-cms-sql/operations/group/SqlListGroups.js";
import { SqlCreateGroup } from "@webiny/api-headless-cms-sql/operations/group/SqlCreateGroup.js";
import { SqlUpdateGroup } from "@webiny/api-headless-cms-sql/operations/group/SqlUpdateGroup.js";
import { SqlDeleteGroup } from "@webiny/api-headless-cms-sql/operations/group/SqlDeleteGroup.js";
import { SqlGetModel } from "@webiny/api-headless-cms-sql/operations/model/SqlGetModel.js";
import { SqlListModels } from "@webiny/api-headless-cms-sql/operations/model/SqlListModels.js";
import { SqlCreateModel } from "@webiny/api-headless-cms-sql/operations/model/SqlCreateModel.js";
import { SqlUpdateModel } from "@webiny/api-headless-cms-sql/operations/model/SqlUpdateModel.js";
import { SqlDeleteModel } from "@webiny/api-headless-cms-sql/operations/model/SqlDeleteModel.js";
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

        // Group: reuse SQL per-method DI classes
        container.register(SqlGetGroup);
        container.register(SqlListGroups);
        container.register(SqlCreateGroup);
        container.register(SqlUpdateGroup);
        container.register(SqlDeleteGroup);

        // Model: reuse SQL per-method DI classes
        container.register(SqlGetModel);
        container.register(SqlListModels);
        container.register(SqlCreateModel);
        container.register(SqlUpdateModel);
        container.register(SqlDeleteModel);

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
