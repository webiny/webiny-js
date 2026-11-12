import { AbstractStorageOps } from "./AbstractStorageOps.js";

/**
 * The Postgres-native CMS storage (with the SQL storage for everything else), tested on an in-process
 * PGlite (WEBINY_SQL_CLIENT=pglite), so the jobs need no Postgres service.
 */
export class PgStorageOps extends AbstractStorageOps {
    id = "pg,sql" as const;
    shortId = "pg";
    displayName = "pg";
}
