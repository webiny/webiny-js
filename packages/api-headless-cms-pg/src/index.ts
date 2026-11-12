import { createFeature } from "@webiny/feature/api/index.js";
import type { Knex } from "knex";
import { ValueFilterFeature } from "@webiny/db-utils";
import { FilterRegistriesFeature } from "@webiny/api-headless-cms-storage";
import { createPgTableNameResolverConfig } from "~/features/config/PgTableNameResolverConfig.js";
import type { IPgStorageSettings } from "~/features/config/abstractions.js";
import { createPgStorageConfig } from "~/features/config/pgStorageSettings.js";
import { TableNameResolverFeature } from "@webiny/api-headless-cms-sql/features/tableNameResolver/feature.js";
import { GroupSchemaManagerFeature } from "@webiny/api-headless-cms-sql/features/groupSchemaManager/feature.js";
import { ModelSchemaManagerFeature } from "@webiny/api-headless-cms-sql/features/modelSchemaManager/feature.js";
import { SqlGroupStorageOpsFeature } from "@webiny/api-headless-cms-sql/operations/group/feature.js";
import { SqlModelStorageOpsFeature } from "@webiny/api-headless-cms-sql/operations/model/feature.js";
import { PgCoreFeature } from "~/features/PgCoreFeature.js";
import { PgEntryStorageOpsFeature } from "~/operations/entry/feature.js";

export { ScopeIndexMode } from "~/features/indexMode/abstractions.js";
export { PgStorageConfig, PG_BUILD_PARAMS } from "~/features/config/abstractions.js";
export type { IPgStorageSettings } from "~/features/config/abstractions.js";
export { readPgStorageSettings } from "~/features/config/pgStorageSettings.js";
export type { IndexMode } from "~/features/indexMode/indexMode.js";
export { SearchIndexer } from "~/features/search/abstractions.js";
export { EntryValuesPatcher } from "~/features/entryValuesPatcher/abstractions.js";
export type {
    IReindexEntriesParams,
    IReindexEntriesResult
} from "~/features/search/abstractions.js";

export interface IPgStorageOperationsConfig {
    knex: Knex;
    tableNamePrefix?: string;
    tableNameSuffix?: string;
    /**
     * The storage's settings; unset ones take their defaults. Handlers read them from the API's
     * build params with `readPgStorageSettings()`. They're passed in here, not read from
     * `BuildParams` by the storage, because the storage is registered in the root container and
     * build params are registered per request.
     */
    settings?: IPgStorageSettings;
}

/**
 * Postgres-native CMS storage: entries live in a jsonb table, and every list / search / filter /
 * sort runs against a typed search table maintained in the same transaction as the entry. Models
 * and groups reuse the SQL storage, which has nothing search-specific in it.
 */
export const HeadlessCmsPgFeature = createFeature<IPgStorageOperationsConfig>({
    name: "cms.storageOperations.pg",
    register: (container, config) => {
        container.register(
            createPgTableNameResolverConfig({
                tableNamePrefix: config.tableNamePrefix,
                tableNameSuffix: config.tableNameSuffix,
                sharedTables: config.settings?.sharedTables
            })
        );
        container.register(createPgStorageConfig(config.settings));

        TableNameResolverFeature.register(container);
        ValueFilterFeature.register(container);
        FilterRegistriesFeature.register(container);
        GroupSchemaManagerFeature.register(container);
        ModelSchemaManagerFeature.register(container);
        SqlGroupStorageOpsFeature.register(container);
        SqlModelStorageOpsFeature.register(container);

        PgCoreFeature.register(container);
        PgEntryStorageOpsFeature.register(container);
    }
});
