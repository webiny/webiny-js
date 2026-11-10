import { createFeature } from "@webiny/feature/api";
import type { Knex } from "knex";
import { ApiCoreStorageOperationsFactory } from "@webiny/api-core";
import { createApiCoreSql } from "./createApiCoreSql.js";
import { SqlSchemaConfig } from "./schemaConfig/index.js";
import { SqlSchemaSetup } from "./schemaSetup/index.js";
import { TableManager } from "./TableManager.js";

export interface ApiCoreSqlConfig {
    knex: Knex;
    tableNamePrefix?: string;
    /**
     * The schema was set up before the API took traffic (the storage's schema setup ran), so no
     * storage code checks for or creates tables at runtime. Registered as `SqlSchemaConfig` for the
     * storage built in the container; off by default, so tables are created on first use.
     */
    schemaManaged?: boolean;
}

/**
 * Registers the SQL implementation of ApiCoreStorageOperationsFactory. ApiCoreFeature.register
 * resolves + builds it. Mirrors ApiCoreDdbFeature.
 *
 * The storage operations are built once, here, and `create()` hands out the same object. It runs on
 * every request (ApiCoreFeature is per-request), and building per request created a new TableManager
 * each time: every one stayed in the global test registry, so a long-running server leaked one per
 * request, and each started with no verified tables. The operations hold no per-request state.
 *
 * It also registers `SqlSchemaConfig` (the schema-managed setting and the table prefix), which every
 * SQL storage and module in the container reads, and the `core` schema setup step.
 */
export const ApiCoreSqlFeature = createFeature<ApiCoreSqlConfig>({
    name: "ApiCoreSql",
    register(container, { knex, tableNamePrefix, schemaManaged = false }) {
        container.registerInstance(SqlSchemaConfig, {
            isManaged: () => schemaManaged,
            tableNamePrefix
        });

        const storageOperations = createApiCoreSql({ knex, tableNamePrefix, schemaManaged });

        container.registerInstance(ApiCoreStorageOperationsFactory, {
            create: () => storageOperations
        });

        /*
         * The tables declared on a TableManager of this connection: core's, and those of any other
         * storage that declares its tables on one (audit logs).
         */
        container.registerInstance(SqlSchemaSetup, {
            name: "core",
            setup: () => TableManager.setupAll(knex)
        });
    }
});
