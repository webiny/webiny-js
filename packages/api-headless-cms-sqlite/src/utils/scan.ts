import { and, asc, eq } from "drizzle-orm";
import { items, type Database } from "@webiny/db-sqlite";

/**
 * List all rows for a given primary partition key, ordered by `sk`. The CMS
 * storage-ops layer typically calls this and then filters / sorts in memory.
 */
export const listByPk = async <T>(db: Database, pk: string): Promise<T[]> => {
    const rows = await db.db
        .select({ data: items.data })
        .from(items)
        .where(eq(items.pk, pk))
        .orderBy(asc(items.sk));
    return rows.map(r => r.data as T);
};

/**
 * Get a batch of rows by exact (pk, sk) tuples.
 */
export const batchGet = async <T>(
    db: Database,
    keys: { pk: string; sk: string }[]
): Promise<T[]> => {
    if (keys.length === 0) {
        return [];
    }
    const found: T[] = [];
    for (const k of keys) {
        const rows = await db.db
            .select({ data: items.data })
            .from(items)
            .where(and(eq(items.pk, k.pk), eq(items.sk, k.sk)))
            .limit(1);
        if (rows.length > 0) {
            found.push(rows[0]!.data as T);
        }
    }
    return found;
};
