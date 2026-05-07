import { describe, it, expect } from "vitest";
import { items } from "~/schema";
import { createDatabase } from "~/database";
import { migrate } from "~/migrate";
import { encodeCursor, decodeCursor, type Cursor } from "~/helpers/cursor";
import { and, eq, gt, or, asc, sql } from "drizzle-orm";

/**
 * Cursor-parity spike — the load-bearing test that justifies the schema
 * choice. DynamoDB returns a `LastEvaluatedKey` (compound JSON) the caller
 * passes back to resume paging. SQLite needs a `(pk, sk)` tuple cursor with
 * equivalent behavior:
 *
 *   - all items returned across pages (no skips)
 *   - no duplicates across pages
 *   - global ordering preserved across pages
 *
 * If this test fails for any pagination edge case, the schema choice for
 * Stage 5+ storage operations is at risk. We exercise it on a 100-item
 * dataset paged at limit=10 (exactly 10 pages, no partial last page) plus a
 * non-divisible variant (limit=7 → 14 full pages + 1 short page).
 */

const PK = "T#root";
const TOTAL = 100;
const PAGE_SIZE = 10;

interface Page {
    rows: { pk: string; sk: string; data: Record<string, unknown> }[];
    nextCursor: Cursor | null;
}

const seed = async (db: ReturnType<typeof createDatabase>["db"]) => {
    // Insert in random order to confirm the query orders by (pk, sk), not by
    // insertion order.
    const all = Array.from({ length: TOTAL }, (_, i) => ({
        pk: PK,
        sk: `item#${String(i + 1).padStart(4, "0")}`,
        data: { i: i + 1 }
    }));
    const shuffled = [...all].sort(() => Math.random() - 0.5);
    for (const row of shuffled) {
        await db.insert(items).values(row);
    }
};

const fetchPage = async (
    db: ReturnType<typeof createDatabase>["db"],
    pageSize: number,
    cursor: Cursor | null
): Promise<Page> => {
    // The "after (pk, sk)" predicate. SQLite supports tuple comparison
    // natively, but Drizzle doesn't expose it directly — fall back to the
    // canonical OR form: pk > cursorPk OR (pk = cursorPk AND sk > cursorSk).
    const afterCursor = cursor
        ? or(gt(items.pk, cursor.pk), and(eq(items.pk, cursor.pk), gt(items.sk, cursor.sk)))
        : sql`1 = 1`;

    const rows = await db
        .select()
        .from(items)
        .where(and(eq(items.pk, PK), afterCursor))
        .orderBy(asc(items.pk), asc(items.sk))
        .limit(pageSize);

    const nextCursor =
        rows.length === pageSize ? { pk: rows.at(-1)!.pk, sk: rows.at(-1)!.sk } : null;

    return { rows: rows as Page["rows"], nextCursor };
};

const pageAll = async (
    db: ReturnType<typeof createDatabase>["db"],
    pageSize: number
): Promise<Page["rows"]> => {
    const collected: Page["rows"] = [];
    let cursor: Cursor | null = null;

    // Hard cap to prevent infinite loops if pagination ever broke.
    for (let i = 0; i < 100; i++) {
        const page = await fetchPage(db, pageSize, cursor);
        collected.push(...page.rows);
        if (!page.nextCursor) {
            return collected;
        }
        cursor = page.nextCursor;
    }
    throw new Error("Pagination did not terminate within 100 pages");
};

describe("pagination cursor parity", () => {
    it("returns all 100 items in (pk, sk) order across 10 pages of 10", async () => {
        const { db, sqlite } = createDatabase();
        migrate(sqlite);
        await seed(db);

        const collected = await pageAll(db, PAGE_SIZE);
        const sks = collected.map(r => r.sk);

        expect(collected).toHaveLength(TOTAL);
        expect(new Set(sks).size).toBe(TOTAL); // no duplicates
        expect(sks).toEqual([...sks].sort()); // globally ordered

        sqlite.close();
    });

    it("handles a non-divisible page size correctly (100 items @ limit=7)", async () => {
        const { db, sqlite } = createDatabase();
        migrate(sqlite);
        await seed(db);

        const collected = await pageAll(db, 7);
        const sks = collected.map(r => r.sk);

        expect(collected).toHaveLength(TOTAL);
        expect(new Set(sks).size).toBe(TOTAL);
        expect(sks).toEqual([...sks].sort());

        sqlite.close();
    });

    it("survives cursor encode/decode round-trip across page boundaries", async () => {
        const { db, sqlite } = createDatabase();
        migrate(sqlite);
        await seed(db);

        // Same flow as `pageAll` but the cursor goes through encode/decode at
        // each boundary — this is what real callers (HTTP / GraphQL) will do.
        const collected: Page["rows"] = [];
        let token: string | null = null;
        for (let i = 0; i < 100; i++) {
            const cursor = token ? decodeCursor(token) : null;
            const page = await fetchPage(db, PAGE_SIZE, cursor);
            collected.push(...page.rows);
            token = page.nextCursor ? encodeCursor(page.nextCursor) : null;
            if (!token) {
                break;
            }
        }

        expect(collected).toHaveLength(TOTAL);
        expect(new Set(collected.map(r => r.sk)).size).toBe(TOTAL);

        sqlite.close();
    });

    it("an empty cursor (null) starts from the first row", async () => {
        const { db, sqlite } = createDatabase();
        migrate(sqlite);
        await seed(db);

        const firstPage = await fetchPage(db, PAGE_SIZE, null);
        expect(firstPage.rows[0]!.sk).toBe("item#0001");

        sqlite.close();
    });
});
