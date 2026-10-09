import { createFeature } from "@webiny/feature/api/index.js";
import { GroupSchemaManagerFeature } from "~/features/groupSchemaManager/feature.js";
import { ModelSchemaManagerFeature } from "~/features/modelSchemaManager/feature.js";
import { EntryTableManagerFeature } from "~/features/entryTableManager/feature.js";
import { TableNameResolverConfig } from "~/features/tableNameResolver/abstractions.js";
import type { Knex } from "knex";
import { TableNameResolverFeature } from "~/features/tableNameResolver/feature.js";
import { ValueFilterFeature } from "@webiny/db-utils";
import { FilterRegistriesFeature } from "@webiny/api-headless-cms-storage";
import { SqlGroupStorageOpsFeature } from "~/operations/group/feature.js";
import { SqlModelStorageOpsFeature } from "~/operations/model/feature.js";
import { SqlEntryStorageOpsFeature } from "~/operations/entry/feature.js";

interface ISqlStorageOperationsConfig {
    knex: Knex;
    tableNamePrefix?: string;
    tableNameSuffix?: string;
}

/**
 * SQL CMS storage. Register it once, in the root container. Table naming and the table managers (which
 * remember the tables they have checked) live for the process; the storage operations are transient,
 * and the filter registries are container scoped, so each request (child) container gets its own.
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
    }
});
