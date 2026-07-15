/**
 * DI-native API GraphQL handler — self-hosted Node server flavour (SQL storage).
 *
 * The composition root lives in @webiny/api-event-handler-server-sql (`createSqlApiHandler`) —
 * the same shared, transport-agnostic request stack the AWS handler uses, over the Node HTTP server
 * transport, with the self-hosted JWT identity provider. This file only supplies project-specific
 * extensions + the SQL (Knex) connection.
 *
 * The default connection is a local SQLite file (`createSqliteConnection`, driven by
 * `<Infra.Sqlite filename="..." />` → WEBINY_SQL_FILENAME). A real deployment can swap this for its
 * own Knex client (Postgres/MySQL) passed straight to `createSqlApiHandler`.
 */
import { createSqlApiHandler, createSqliteConnection } from "@webiny/api-event-handler-server-sql";
import { extensions } from "./extensions";

export const handler = createSqlApiHandler({ extensions, knex: createSqliteConnection() });
