/**
 * DI-native API GraphQL handler — self-hosted Node server flavour (SQL storage).
 *
 * The composition root lives in @webiny/api-event-handler-server-sql (`createWebinyApiHandler`) —
 * the same shared, transport-agnostic request stack the AWS handler uses, over the Node HTTP server
 * transport, with the self-hosted JWT identity provider. This file only supplies project-specific
 * extensions + the SQL (Knex) connection.
 *
 * ⚠️ EXPERIMENTAL — the server transport is complete (routing + auth/tenant loaders + self-hosted
 * IdP) but not yet runtime-verified end-to-end against a live DB. Provided as the server-flavour
 * starting point.
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
