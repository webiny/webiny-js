import { describe, it, expect } from "vitest";
import { items } from "~/schema";
import { createDatabase } from "~/database";
import { migrate, listMigrations } from "~/migrate";
import { sql } from "drizzle-orm";

describe("schema migration", () => {
    it("creates the items table, GSI indexes, and FTS5 shadow on a fresh DB", () => {
        const { sqlite } = createDatabase();
        migrate(sqlite);

        const tables = sqlite
            .prepare(
                `SELECT name FROM sqlite_master
                 WHERE type IN ('table', 'index') AND name NOT LIKE 'sqlite_%'
                 ORDER BY name`
            )
            .all() as { name: string }[];

        const names = tables.map(t => t.name);

        expect(names).toContain("items");
        expect(names).toContain("idx_items_gsi1");
        expect(names).toContain("idx_items_gsi_tenant");
        expect(names).toContain("idx_items_expires_at");
        expect(names).toContain("items_fts");

        sqlite.close();
    });

    it("is idempotent — running migrate twice is a no-op", () => {
        const { sqlite } = createDatabase();
        migrate(sqlite);
        migrate(sqlite);

        const applied = sqlite.prepare("SELECT name FROM _migrations").all() as { name: string }[];
        expect(applied).toHaveLength(listMigrations().length);

        sqlite.close();
    });

    it("supports basic CRUD against items via Drizzle", async () => {
        const { db, sqlite } = createDatabase();
        migrate(sqlite);

        await db.insert(items).values({
            pk: "T#root",
            sk: "user#alice",
            data: { email: "alice@example.com" },
            version: 1
        });

        const rows = await db.select().from(items);
        expect(rows).toHaveLength(1);
        expect(rows[0]!.data).toEqual({ email: "alice@example.com" });
        expect(rows[0]!.version).toBe(1);
        expect(rows[0]!.expiresAt).toBeNull();

        sqlite.close();
    });

    it("supports FTS5 full-text search via the items_fts shadow", () => {
        const { sqlite } = createDatabase();
        migrate(sqlite);

        const insertFts = sqlite.prepare(
            "INSERT INTO items_fts (pk, sk, content) VALUES (?, ?, ?)"
        );
        insertFts.run("T#root", "post#1", "How to build a containerized framework");
        insertFts.run("T#root", "post#2", "Serverless deployments and Lambda timeouts");
        insertFts.run("T#root", "post#3", "A short note on FTS5 in SQLite");

        const matches = sqlite
            .prepare("SELECT pk, sk FROM items_fts WHERE items_fts MATCH ?")
            .all("containerized OR sqlite") as { pk: string; sk: string }[];

        expect(matches.map(m => m.sk).sort()).toEqual(["post#1", "post#3"]);

        sqlite.close();
    });

    it("composite (pk, sk) primary key prevents duplicate inserts", async () => {
        const { db, sqlite } = createDatabase();
        migrate(sqlite);

        await db.insert(items).values({ pk: "T#root", sk: "u#1", data: { v: 1 } });

        await expect(
            db.insert(items).values({ pk: "T#root", sk: "u#1", data: { v: 2 } })
        ).rejects.toThrow();

        sqlite.close();
    });

    it("filters rows past expires_at when the caller scopes the query to live rows", async () => {
        const { db, sqlite } = createDatabase();
        migrate(sqlite);

        const now = Math.floor(Date.now() / 1000);
        await db.insert(items).values([
            { pk: "T#root", sk: "live", data: {}, expiresAt: now + 3600 },
            { pk: "T#root", sk: "expired", data: {}, expiresAt: now - 3600 },
            { pk: "T#root", sk: "no-ttl", data: {} }
        ]);

        // Storage-ops layer is responsible for adding the live-rows predicate;
        // confirm the schema supports it cleanly.
        const live = await db
            .select({ sk: items.sk })
            .from(items)
            .where(sql`${items.expiresAt} IS NULL OR ${items.expiresAt} > ${now}`);

        expect(live.map(r => r.sk).sort()).toEqual(["live", "no-ttl"]);

        sqlite.close();
    });
});
