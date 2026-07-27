import type { Container } from "@webiny/di";
import { SqlEntryOperationsFeature } from "~/operations/entry/feature.js";
import { createRegisterExtensionPlugin } from "@webiny/handler";
import { createFeature } from "@webiny/feature/api/index.js";
import { GroupSchemaManagerFeature } from "~/features/groupSchemaManager/feature.js";
import { ModelSchemaManagerFeature } from "~/features/modelSchemaManager/feature.js";
import { EntryTableManagerFeature } from "~/features/entryTableManager/feature.js";
import { TableNameResolverConfig } from "~/features/tableNameResolver/abstractions.js";
import type { Knex } from "knex";
import { TableNameResolverFeature } from "~/features/tableNameResolver/feature.js";
import { ValueFilterFeature } from "@webiny/db-utils";
import { FilterRegistriesFeature } from "@webiny/api-headless-cms-storage";
import { SqlGroupStorageOperations } from "~/operations/group/SqlGroupStorageOperations.js";
import { SqlModelStorageOperations } from "~/operations/model/SqlModelStorageOperations.js";
import { SqlEntryStorageOpsFeature } from "~/SqlEntryStorageOpsFeature.js";

interface ISqlStorageOperationsConfig {
    knex: Knex;
    tableNamePrefix?: string;
    tableNameSuffix?: string;
}

export const HeadlessCmsSqlFeature = createFeature({
    name: "cms.storageOperations.sql",
    register: (container: Container, config: ISqlStorageOperationsConfig) => {
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

        // Group + model: DI classes, app-scoped singletons
        container.register(SqlGroupStorageOperations).inSingletonScope();
        container.register(SqlModelStorageOperations).inSingletonScope();

        // Entry ops: 22 per-method factories delegating to SqlEntryOperations
        SqlEntryStorageOpsFeature.register(container);
    }
});

export const registerSqlStorageOperations = (config: ISqlStorageOperationsConfig) => {
    const plugin = createRegisterExtensionPlugin(context => {
        return HeadlessCmsSqlFeature.register(context.container, config);
    });

    plugin.name = "cms.registerSqlStorageOperations";

    return [plugin];
};
