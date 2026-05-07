import BetterSqlite, { type Database as SqliteHandle } from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";

export interface CreateDatabaseParams {
    /**
     * Path to the SQLite file. Use `":memory:"` for an in-process database
     * (handy for tests). Defaults to `":memory:"`.
     */
    filename?: string;
    /**
     * If true, every SQL statement is logged to stderr via Drizzle's logger.
     * Defaults to false.
     */
    debug?: boolean;
}

export interface Database {
    db: BetterSQLite3Database<typeof schema>;
    sqlite: SqliteHandle;
    schema: typeof schema;
    close: () => void;
}

/**
 * Open a SQLite database and wrap it with Drizzle. The returned object
 * exposes a `drizzle` query API plus the underlying better-sqlite3 handle
 * (for migrations and `.close()`).
 *
 * Pragmas are tuned for typical container workloads:
 *   - `journal_mode = WAL`  — concurrent reads + writes
 *   - `foreign_keys = ON`   — enforce referential integrity if any FKs exist
 *   - `synchronous = NORMAL`— durability vs throughput tradeoff sensible
 *                            for application data (NOT financial-grade)
 */
export const createDatabase = (params: CreateDatabaseParams = {}): Database => {
    const sqlite = new BetterSqlite(params.filename ?? ":memory:");

    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    sqlite.pragma("synchronous = NORMAL");

    const db = drizzle(sqlite, {
        schema,
        logger: params.debug === true
    });

    return {
        db,
        sqlite,
        schema,
        close: () => sqlite.close()
    };
};
