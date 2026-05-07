import { describe, it, expect } from "vitest";
import { items, beginsWith, between, encodeCursor, decodeCursor, tryDecodeCursor } from "~/index";
import { createDatabase } from "~/database";
import { migrate } from "~/migrate";
import { and, eq } from "drizzle-orm";

describe("beginsWith", () => {
    it("matches rows by sk prefix", async () => {
        const { db, sqlite } = createDatabase();
        migrate(sqlite);

        await db.insert(items).values([
            { pk: "T#root", sk: "user#alice", data: { name: "Alice" } },
            { pk: "T#root", sk: "user#bob", data: { name: "Bob" } },
            { pk: "T#root", sk: "post#one", data: { title: "Post one" } }
        ]);

        const rows = await db
            .select()
            .from(items)
            .where(and(eq(items.pk, "T#root"), beginsWith(items.sk, "user#")));

        expect(rows).toHaveLength(2);
        expect(rows.map(r => r.sk).sort()).toEqual(["user#alice", "user#bob"]);

        sqlite.close();
    });

    it("escapes LIKE wildcards in the prefix so they're matched literally", async () => {
        const { db, sqlite } = createDatabase();
        migrate(sqlite);

        await db.insert(items).values([
            { pk: "T#root", sk: "literal_underscore", data: {} },
            // Adversarial sk: contains the literal char sequence we'd otherwise expand
            { pk: "T#root", sk: "literalXunderscore", data: {} }
        ]);

        // Without escaping, `_` would match any single char and pick up both rows.
        const rows = await db
            .select()
            .from(items)
            .where(and(eq(items.pk, "T#root"), beginsWith(items.sk, "literal_")));

        expect(rows).toHaveLength(1);
        expect(rows[0]!.sk).toBe("literal_underscore");

        sqlite.close();
    });
});

describe("between", () => {
    it("matches rows whose sk falls in the inclusive range", async () => {
        const { db, sqlite } = createDatabase();
        migrate(sqlite);

        await db.insert(items).values([
            { pk: "T#root", sk: "0001", data: {} },
            { pk: "T#root", sk: "0050", data: {} },
            { pk: "T#root", sk: "0100", data: {} },
            { pk: "T#root", sk: "0150", data: {} }
        ]);

        const rows = await db
            .select()
            .from(items)
            .where(and(eq(items.pk, "T#root"), between(items.sk, "0050", "0100")));

        expect(rows.map(r => r.sk).sort()).toEqual(["0050", "0100"]);

        sqlite.close();
    });
});

describe("cursor encoding", () => {
    it("round-trips a (pk, sk) cursor through base64url", () => {
        const original = { pk: "T#root", sk: "user#zoë" };
        const encoded = encodeCursor(original);
        expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/); // base64url alphabet
        expect(decodeCursor(encoded)).toEqual(original);
    });

    it("preserves extra fields for GSI cursors", () => {
        const original = {
            pk: "T#root",
            sk: "u#alice",
            gsi1Pk: "GSI1#users",
            gsi1Sk: "alice"
        };
        expect(decodeCursor(encodeCursor(original))).toEqual(original);
    });

    it("decodeCursor throws on a malformed token", () => {
        expect(() => decodeCursor("not-a-valid-cursor")).toThrow();
    });

    it("tryDecodeCursor returns null on missing or malformed input", () => {
        expect(tryDecodeCursor(undefined)).toBeNull();
        expect(tryDecodeCursor(null)).toBeNull();
        expect(tryDecodeCursor("")).toBeNull();
        expect(tryDecodeCursor("garbage")).toBeNull();
    });
});
