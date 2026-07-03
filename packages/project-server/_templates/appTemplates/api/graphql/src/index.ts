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
import path from "node:path";
import knex from "knex";
import { createWebinyApiHandler } from "@webiny/api-event-handler-server-sql";
import { extensions } from "./extensions";

// SQL connection. Defaults to a project-local sqlite FILE (not :memory:) so data persists across
// restarts/reloads and is inspectable (`sqlite3 <file> .tables`). Point WEBINY_SQL_FILENAME elsewhere,
// or swap the client for Postgres/MySQL, in a real deployment.
// TODO: source this from project config once server-flavour DB configuration lands.
const filename =
    process.env.WEBINY_SQL_FILENAME || path.join(process.cwd(), ".webiny", "server.sqlite");

const db = knex({
    client: "better-sqlite3",
    connection: { filename },
    useNullAsDefault: true
});

export const handler = createWebinyApiHandler({ extensions, knex: db });
