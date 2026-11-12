import { createFeature } from "@webiny/feature/api/index.js";
import { GroupSchemaManagerFeature } from "~/features/groupSchemaManager/feature.js";
import { ModelSchemaManagerFeature } from "~/features/modelSchemaManager/feature.js";
import { EntryTableManagerFeature } from "~/features/entryTableManager/feature.js";
import { TableNameResolverConfig } from "~/features/tableNameResolver/abstractions.js";
import { TableNameResolverFeature } from "~/features/tableNameResolver/feature.js";
import { ValueFilterFeature } from "@webiny/db-utils";
import { FilterRegistriesFeature } from "@webiny/api-headless-cms-storage";
import { SqlGroupStorageOpsFeature } from "~/operations/group/feature.js";
import { SqlModelStorageOpsFeature } from "~/operations/model/feature.js";
import { SqlEntryStorageOpsFeature } from "~/operations/entry/feature.js";
import { CmsSqlSchemaSetup } from "~/features/CmsSqlSchemaSetup.js";

interface ISqlStorageOperationsConfig {
    tableNamePrefix?: string;
    tableNameSuffix?: string;
}

/**
 * SQL CMS storage, on the connection in the container (`KnexClient`). Registered per request, by the
 * SQLite storage. What the table managers learn about the tables (which exist) is kept for the
 * process, in the schema memory (`getSchemaMemory`), so a new request doesn't check them again.
 */
export const HeadlessCmsSqlFeature = createFeature<ISqlStorageOperationsConfig>({
    name: "cms.storageOperations.sql",
    register: (container, config) => {
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

        FilterRegistriesFeature.register(container);
        SqlGroupStorageOpsFeature.register(container);
        SqlModelStorageOpsFeature.register(container);
        SqlEntryStorageOpsFeature.register(container);

        // The `cms` schema setup step.
        container.register(CmsSqlSchemaSetup);
    }
});
