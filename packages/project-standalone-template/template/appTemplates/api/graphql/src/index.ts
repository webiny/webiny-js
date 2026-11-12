/**
 * DI-native API GraphQL handler — standalone hosting type (Node server, SQL storage).
 *
 * The composition root lives in @webiny/api-event-handler-standalone-sql (`createSqlApiHandler`) —
 * the same shared, transport-agnostic request stack the AWS handler uses, over the Node HTTP server
 * transport, with the self-hosted JWT identity provider. This file only supplies project-specific
 * extensions + the storage, built from its connection.
 *
 * The connection and storage below are generated at build time from the DB infra extension
 * (`<Infra.Sqlite>` / `<Infra.Postgres>` / `<Infra.Pglite>`) in webiny.config.tsx — see
 * GenerateApiDbConnection, which decorates the workspace build. It replaces the
 * `__WEBINY_DB_CONNECTION__` and `__WEBINY_STORAGE__` imports with the chosen connection factory and
 * storage (SQLite: @webiny/api-storage-sqlite; Postgres and PGlite: @webiny/api-storage-pg), rewriting
 * each specifier to its own module path so only the selected driver is traced into the bundle (the
 * other database driver and its native binary stay out of the deploy artifact). The placeholders
 * import the real package here so the template parses, lints, and passes dependency checks before
 * substitution.
 */
import { createSqlApiHandler } from "@webiny/api-event-handler-standalone-sql";
import { __WEBINY_DB_CONNECTION__ } from "@webiny/api-storage-sqlite";
import { __WEBINY_STORAGE__ } from "@webiny/api-storage-sqlite";
import { extensions } from "./extensions";

export const handler = createSqlApiHandler({
    extensions,
    storage: __WEBINY_STORAGE__({ knex: __WEBINY_DB_CONNECTION__() })
});
