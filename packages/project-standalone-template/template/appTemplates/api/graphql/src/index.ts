/**
 * DI-native API GraphQL handler — standalone hosting type (Node server, SQL storage).
 *
 * The composition root lives in @webiny/api-event-handler-standalone-sql (`createSqlApiHandler`), or
 * for the Postgres-native storage in @webiny/api-event-handler-standalone-pg
 * (`createPgApiHandler`) —
 * the same shared, transport-agnostic request stack the AWS handler uses, over the Node HTTP server
 * transport, with the self-hosted JWT identity provider. This file only supplies project-specific
 * extensions + the SQL (Knex) connection.
 *
 * The connection factory below is generated at build time from the DB infra extension
 * (`<Infra.Sqlite>` / `<Infra.Postgres>`) in webiny.config.tsx — see GenerateApiDbConnection, which
 * decorates the workspace build. It replaces the `__WEBINY_DB_FACTORY__` import with the chosen
 * factory, rewriting the specifier to that factory's own module path so only the selected driver is
 * traced into the bundle (the other database driver and its native binary stay out of the deploy
 * artifact). The api handler is chosen the same way, from the storage the DB infra extension selects
 * (`__WEBINY_API_HANDLER__`). The placeholders import the real package here so the template parses,
 * lints, and passes dependency checks before substitution.
 */
import { __WEBINY_API_HANDLER__ } from "@webiny/api-event-handler-standalone-sql";
import { __WEBINY_DB_FACTORY__ } from "@webiny/api-event-handler-standalone-sql";
import { extensions } from "./extensions";

export const handler = __WEBINY_API_HANDLER__({ extensions, knex: __WEBINY_DB_FACTORY__() });
