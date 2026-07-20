import fs from "node:fs";
import path from "node:path";
import knex, { type Knex } from "knex";

export interface CreateSqliteConnectionOptions {
    /**
     * Path to the SQLite database file. Defaults to `WEBINY_SQL_FILENAME` (baked by
     * `<Infra.Sqlite filename="..." />` in webiny.config).
     */
    filename?: string;
}

/**
 * Build a Knex client backed by a local SQLite file (better-sqlite3) for the self-hosted server
 * flavour. This is the default self-hosted storage connection; a real deployment can instead pass its
 * own Knex client (Postgres/MySQL) straight to `createSqlApiHandler`.
 *
 * The database file is mandatory: it comes from `WEBINY_SQL_FILENAME` (or an explicit `filename`),
 * which `<Infra.Sqlite>` resolves to an absolute, project-root path so data survives rebuilds. There
 * is no implicit default — a cwd-relative fallback would land in the disposable app workspace and
 * lose data on the next build.
 */
export function createSqliteConnection(options: CreateSqliteConnectionOptions = {}): Knex {
    const filename = options.filename || process.env.WEBINY_SQL_FILENAME;
    if (!filename) {
        throw new Error(
            `WEBINY_SQL_FILENAME is not set. Configure the database via <Infra.Sqlite filename="..." /> in webiny.config.`
        );
    }

    // better-sqlite3 won't create missing parent dirs — ensure the target directory exists.
    fs.mkdirSync(path.dirname(filename), { recursive: true });

    return knex({
        client: "better-sqlite3",
        connection: { filename },
        useNullAsDefault: true
    });
}
