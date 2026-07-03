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
 */
export const ApiCoreSqlFeature = createFeature<ApiCoreSqlConfig>({
    name: "ApiCoreSql",
    register(container, { knex, tableNamePrefix }) {
        container.registerInstance(ApiCoreStorageOperationsFactory, {
            create: () => createApiCoreSql({ knex, tableNamePrefix })
        });
    }
});
