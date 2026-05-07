/**
 * Initial migration. Mirrors the Drizzle schema in `~/schema.ts` plus the
 * FTS5 virtual table for full-text search. Drizzle can't model FTS5 virtual
 * tables directly, so the SQL here is the source of truth for migrations.
 *
 * Keep this file and `~/schema.ts` in sync manually for now. A future
 * iteration could move migration generation to `drizzle-kit`.
 */
export const initialMigration = {
    name: "0001_initial",
    sql: `
CREATE TABLE IF NOT EXISTS items (
    pk              TEXT NOT NULL,
    sk              TEXT NOT NULL,
    gsi1_pk         TEXT,
    gsi1_sk         TEXT,
    gsi_tenant_pk   TEXT,
    gsi_tenant_sk   TEXT,
    data            TEXT NOT NULL,
    version         INTEGER NOT NULL DEFAULT 0,
    expires_at      INTEGER,
    PRIMARY KEY (pk, sk)
);

CREATE INDEX IF NOT EXISTS idx_items_gsi1
    ON items (gsi1_pk, gsi1_sk);

CREATE INDEX IF NOT EXISTS idx_items_gsi_tenant
    ON items (gsi_tenant_pk, gsi_tenant_sk);

CREATE INDEX IF NOT EXISTS idx_items_expires_at
    ON items (expires_at)
    WHERE expires_at IS NOT NULL;

CREATE VIRTUAL TABLE IF NOT EXISTS items_fts USING fts5 (
    pk UNINDEXED,
    sk UNINDEXED,
    content,
    tokenize='porter unicode61'
);
`
} as const;
