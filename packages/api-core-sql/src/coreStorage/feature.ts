import { createFeature } from "@webiny/feature/api";
import { SqlApiCoreStorageOperationsFactory } from "./SqlApiCoreStorageOperationsFactory.js";
import { CoreSqlSchemaSetup } from "./CoreSqlSchemaSetup.js";

/**
 * The SQL core storage of a request: the implementation of `ApiCoreStorageOperationsFactory`, which
 * `ApiCoreFeature.register` resolves and builds, and the `core` schema setup step. Mirrors
 * `ApiCoreDdbFeature`.
 *
 * Registered per request (by the SQL storage's `RequestStorage`). It runs on what the root holds:
 * the connection (`KnexClient`) and the table prefix and schema-managed setting (`SqlSchemaConfig`),
 * both registered by `SqlConnectionFeature`.
 */
export const ApiCoreSqlFeature = createFeature({
    name: "ApiCoreSql",
    register(container) {
        container.register(SqlApiCoreStorageOperationsFactory);
        container.register(CoreSqlSchemaSetup);
    }
});
