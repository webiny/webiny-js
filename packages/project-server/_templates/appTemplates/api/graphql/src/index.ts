/**
 * DI-native API GraphQL handler — self-hosted Node server flavour (SQL storage).
 *
 * The composition root lives in @webiny/api-event-handler-server-sql (`createWebinyApiHandler`) —
 * the same shared, transport-agnostic request stack the AWS handler uses, over the Node HTTP server
 * transport. This file only supplies project-specific extensions + the SQL (Knex) connection.
 *
 * ⚠️ EXPERIMENTAL — the server transport is not yet deployable (missing Node routing terminal +
 * auth/tenant loaders; see @webiny/api-event-handler-server). Provided as the server-flavour starting
 * point.
 */
import knex from "knex";
import { createWebinyApiHandler } from "@webiny/api-event-handler-server-sql";
import { extensions } from "./extensions";

// TODO: source the connection from project config / env. In-memory sqlite is a placeholder so the
// handler is self-contained until server-flavour DB configuration lands.
const db = knex({
    client: "better-sqlite3",
    connection: { filename: process.env.WEBINY_SQL_FILENAME || ":memory:" },
    useNullAsDefault: true
});

export const handler = createWebinyApiHandler({ extensions, knex: db });
