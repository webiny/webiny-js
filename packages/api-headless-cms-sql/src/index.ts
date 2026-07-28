import type { Container } from "@webiny/di";
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
import { SqlGetGroup } from "~/operations/group/SqlGetGroup.js";
import { SqlListGroups } from "~/operations/group/SqlListGroups.js";
import { SqlCreateGroup } from "~/operations/group/SqlCreateGroup.js";
import { SqlUpdateGroup } from "~/operations/group/SqlUpdateGroup.js";
import { SqlDeleteGroup } from "~/operations/group/SqlDeleteGroup.js";
import { SqlGetModel } from "~/operations/model/SqlGetModel.js";
import { SqlListModels } from "~/operations/model/SqlListModels.js";
import { SqlCreateModel } from "~/operations/model/SqlCreateModel.js";
import { SqlUpdateModel } from "~/operations/model/SqlUpdateModel.js";
import { SqlDeleteModel } from "~/operations/model/SqlDeleteModel.js";
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

        // Group: per-method DI classes
        container.register(SqlGetGroup);
        container.register(SqlListGroups);
        container.register(SqlCreateGroup);
        container.register(SqlUpdateGroup);
        container.register(SqlDeleteGroup);

        // Model: per-method DI classes
        container.register(SqlGetModel);
        container.register(SqlListModels);
        container.register(SqlCreateModel);
        container.register(SqlUpdateModel);
        container.register(SqlDeleteModel);

        // Entry ops: 22 per-method DI classes
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
