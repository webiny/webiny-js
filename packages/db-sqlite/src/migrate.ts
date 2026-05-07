import type { Database as SqliteDatabase } from "better-sqlite3";
import { initialMigration } from "./migrations/0001_initial.js";

export interface Migration {
    name: string;
    sql: string;
}

const MIGRATIONS: readonly Migration[] = [initialMigration];

const ensureMigrationsTable = (sqlite: SqliteDatabase): void => {
    sqlite.exec(`
        CREATE TABLE IF NOT EXISTS _migrations (
            name TEXT PRIMARY KEY,
            applied_at INTEGER NOT NULL
        );
    `);
};

const isApplied = (sqlite: SqliteDatabase, name: string): boolean => {
    const row = sqlite.prepare("SELECT 1 FROM _migrations WHERE name = ?").get(name) as
        | { 1: number }
        | undefined;
    return row !== undefined;
};

const recordApplied = (sqlite: SqliteDatabase, name: string): void => {
    sqlite
        .prepare("INSERT INTO _migrations (name, applied_at) VALUES (?, ?)")
        .run(name, Date.now());
};

/**
 * Apply any not-yet-applied migrations in order. Idempotent — safe to call on
 * every container start. Each migration runs inside a transaction so partial
 * application can't leave the schema half-built.
 */
export const migrate = (sqlite: SqliteDatabase): void => {
    ensureMigrationsTable(sqlite);

    for (const migration of MIGRATIONS) {
        if (isApplied(sqlite, migration.name)) {
            continue;
        }

        const apply = sqlite.transaction(() => {
            sqlite.exec(migration.sql);
            recordApplied(sqlite, migration.name);
        });

        apply();
    }
};

export const listMigrations = (): readonly Migration[] => MIGRATIONS;
