import { createFeature } from "@webiny/feature/api";
import type { Knex } from "knex";
import { ApiCoreStorageOperationsFactory } from "@webiny/api-core";
import { createApiCoreSql } from "./createApiCoreSql.js";

export interface ApiCoreSqlConfig {
    knex: Knex;
    tableNamePrefix?: string;
}

/**
 * Registers the SQL implementation of ApiCoreStorageOperationsFactory. ApiCoreFeature.register
 * resolves + builds it. Mirrors ApiCoreDdbFeature.
 *
 * The storage operations are built once, here, and `create()` hands out the same object. It runs on
 * every request (ApiCoreFeature is per-request), and building per request created a new TableManager
 * each time: every one stayed in the global test registry, so a long-running server leaked one per
 * request, and each started with no verified tables. The operations hold no per-request state.
 */
export const ApiCoreSqlFeature = createFeature<ApiCoreSqlConfig>({
    name: "ApiCoreSql",
    register(container, { knex, tableNamePrefix }) {
        const storageOperations = createApiCoreSql({ knex, tableNamePrefix });

        container.registerInstance(ApiCoreStorageOperationsFactory, {
            create: () => storageOperations
        });
    }
});
