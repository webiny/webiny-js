import { createFeature } from "@webiny/feature/api/index.js";
import { GroupSchemaManagerFeature } from "~/features/groupSchemaManager/feature.js";
import { ModelSchemaManagerFeature } from "~/features/modelSchemaManager/feature.js";
import { EntryTableManagerFeature } from "~/features/entryTableManager/feature.js";
import { TableNameResolverConfig } from "~/features/tableNameResolver/abstractions.js";
import type { Knex } from "knex";
import { TableNameResolverFeature } from "~/features/tableNameResolver/feature.js";
import { ValueFilterFeature } from "@webiny/db-utils";

export { HeadlessCmsSqlRequestFeature } from "~/requestFeature.js";

interface ISqlStorageOperationsConfig {
    knex: Knex;
    tableNamePrefix?: string;
    tableNameSuffix?: string;
}

/**
 * Root half of the SQL CMS storage: table naming and the table managers, which remember the tables
 * they have checked for the life of the process. The storage operations are per request, in
 * `HeadlessCmsSqlRequestFeature`.
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
    }
});
