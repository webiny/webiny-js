import { and, asc, eq, isNull, gt, or, sql } from "drizzle-orm";
import { items, type Database, beginsWith } from "@webiny/db-sqlite";

/**
 * Predicate that filters out rows past their `expires_at` timestamp.
 * Mirrors DynamoDB TTL semantics — TTL'd rows are invisible to queries.
 */
const liveRowsOnly = () => {
    const now = Math.floor(Date.now() / 1000);
    return or(isNull(items.expiresAt), gt(items.expiresAt, now));
};

export interface ListByGsi1Params {
    gsi1Pk: string;
    /**
     * If set, restrict to rows whose `gsi1_sk` starts with this prefix.
     * Mirrors DynamoDB's `begins_with` query option.
     */
    beginsWithSk?: string;
}

/**
 * Read all rows by GSI1 (the most-frequent secondary index — used by every
 * `*-ddb` storage-ops module for entity-list queries).
 *
 * The result is sorted by `gsi1_sk` ascending, which matches the natural DDB
 * query order. The order is critical because some tests (notably
 * `parallelQueries.test.ts`) rely on it.
 */
export const listByGsi1 = async <T>(db: Database, params: ListByGsi1Params): Promise<T[]> => {
    const conditions = [eq(items.gsi1Pk, params.gsi1Pk), liveRowsOnly()];
    if (params.beginsWithSk !== undefined) {
        conditions.push(beginsWith(items.gsi1Sk, params.beginsWithSk));
    }

    const rows = await db.db
        .select({ data: items.data })
        .from(items)
        .where(and(...conditions))
        .orderBy(asc(items.gsi1Sk));

    return rows.map(r => r.data as T);
};

/**
 * Batch read rows by primary key.
 */
export const batchGetByPk = async <T>(
    db: Database,
    keys: { pk: string; sk: string }[]
): Promise<T[]> => {
    if (keys.length === 0) {
        return [];
    }

    // Build an OR predicate of all (pk, sk) pairs. better-sqlite3 has a
    // generous parameter limit (default 32766) so this is fine for batches
    // we'd realistically see.
    const predicates = keys.map(k => and(eq(items.pk, k.pk), eq(items.sk, k.sk)));
    const where = predicates.length === 1 ? predicates[0] : or(...predicates);

    const rows = await db.db
        .select({ data: items.data })
        .from(items)
        .where(and(where, liveRowsOnly()));

    return rows.map(r => r.data as T);
};

/**
 * Find a single row by `gsi1_pk` + exact `gsi1_sk`. Used to resolve queries
 * like "api key by token" or "role by slug".
 */
export const findByGsi1Sk = async <T>(
    db: Database,
    gsi1Pk: string,
    gsi1Sk: string
): Promise<T | null> => {
    const rows = await db.db
        .select({ data: items.data })
        .from(items)
        .where(and(eq(items.gsi1Pk, gsi1Pk), eq(items.gsi1Sk, gsi1Sk), liveRowsOnly()))
        .limit(1);

    if (rows.length === 0) {
        return null;
    }
    return rows[0]!.data as T;
};

export { liveRowsOnly };
export { sql };
