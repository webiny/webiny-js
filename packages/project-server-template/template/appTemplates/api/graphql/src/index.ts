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
import fs from "node:fs";
import path from "node:path";
import knex from "knex";
import { createWebinyApiHandler } from "@webiny/api-event-handler-server-sql";
import { extensions } from "./extensions";

// SQL connection. The database is configured via `<Infra.Sqlite filename="..." />` in webiny.config,
// which bakes WEBINY_SQL_FILENAME (an absolute, project-root-relative path). It's mandatory: there is
// no implicit fallback, since a cwd-relative default would land in the disposable app workspace and
// lose data on the next build.
const filename = process.env.WEBINY_SQL_FILENAME;
if (!filename) {
    throw new Error(
        `WEBINY_SQL_FILENAME is not set. Configure the database via <Infra.Sqlite filename="..." /> in webiny.config.`
    );
}

// better-sqlite3 won't create missing parent dirs — ensure the target directory exists.
fs.mkdirSync(path.dirname(filename), { recursive: true });

const db = knex({
    client: "better-sqlite3",
    connection: { filename },
    useNullAsDefault: true
});

export const handler = createWebinyApiHandler({ extensions, knex: db });
