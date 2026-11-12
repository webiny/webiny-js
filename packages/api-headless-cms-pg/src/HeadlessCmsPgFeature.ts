import { createFeature } from "@webiny/feature/api/index.js";
import { ValueFilterFeature } from "@webiny/db-utils";
import { FilterRegistriesFeature } from "@webiny/api-headless-cms-storage";
import { PgTableNameResolverConfig } from "~/features/config/PgTableNameResolverConfig.js";
import { BuildParamsPgStorageConfig } from "~/features/config/pgStorageSettings.js";
import { TableNameResolverFeature } from "@webiny/api-headless-cms-sql/features/tableNameResolver/feature.js";
import { GroupSchemaManagerFeature } from "@webiny/api-headless-cms-sql/features/groupSchemaManager/feature.js";
import { ModelSchemaManagerFeature } from "@webiny/api-headless-cms-sql/features/modelSchemaManager/feature.js";
import { SqlGroupStorageOpsFeature } from "@webiny/api-headless-cms-sql/operations/group/feature.js";
import { SqlModelStorageOpsFeature } from "@webiny/api-headless-cms-sql/operations/model/feature.js";
import { PgCoreFeature } from "~/features/PgCoreFeature.js";
import { CmsPgSchemaSetup } from "~/features/schema/CmsPgSchemaSetup.js";
import { PgEntryStorageOpsFeature } from "~/operations/entry/feature.js";

/**
 * Postgres-native CMS storage: entries live in a jsonb table, and every list / search / filter /
 * sort runs against a typed search table maintained in the same transaction as the entry. Models
 * and groups reuse the SQL storage, which has nothing search-specific in it.
 *
 * A module on top of the Postgres SQL storage (`createPgStorage` in `@webiny/api-storage-pg`): it
 * runs on the storage's connection (`KnexClient`) and table prefix (`SqlSchemaConfig`), and reads
 * its settings from the `HeadlessCmsPg` build param. Register it in each request's container, as
 * the project's extensions are (`<HeadlessCmsPg />` adds it); what it keeps for the process (which
 * tables exist, scope modes, row estimates) lives in process-wide caches. It also registers its
 * `cms` schema setup step.
 */
export const HeadlessCmsPgFeature = createFeature({
    name: "cms.storageOperations.pg",
    register: container => {
        container.register(BuildParamsPgStorageConfig);
        container.register(PgTableNameResolverConfig);

        TableNameResolverFeature.register(container);
        ValueFilterFeature.register(container);
        FilterRegistriesFeature.register(container);
        GroupSchemaManagerFeature.register(container);
        ModelSchemaManagerFeature.register(container);
        SqlGroupStorageOpsFeature.register(container);
        SqlModelStorageOpsFeature.register(container);

        PgCoreFeature.register(container);
        PgEntryStorageOpsFeature.register(container);

        // The `cms` schema setup step.
        container.register(CmsPgSchemaSetup);
    }
});
