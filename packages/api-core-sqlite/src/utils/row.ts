import { and, eq } from "drizzle-orm";
import { items, type Database } from "@webiny/db-sqlite";

export interface PrimaryKey {
    pk: string;
    sk: string;
}

/**
 * Read one row by primary key. Returns null if no row exists.
 */
export const getRow = async <T>(db: Database, key: PrimaryKey): Promise<T | null> => {
    const rows = await db.db
        .select()
        .from(items)
        .where(and(eq(items.pk, key.pk), eq(items.sk, key.sk)))
        .limit(1);

    if (rows.length === 0) {
        return null;
    }
    return rows[0]!.data as T;
};

/**
 * Insert or replace a row at the given primary key. Drizzle's `onConflictDo`
 * handles the upsert path.
 */
export const upsertRow = async <T extends object>(
    db: Database,
    key: PrimaryKey,
    data: T,
    extra: {
        gsi1Pk?: string | null;
        gsi1Sk?: string | null;
        gsiTenantPk?: string | null;
        gsiTenantSk?: string | null;
        expiresAt?: number | null;
    } = {}
): Promise<void> => {
    const row = {
        pk: key.pk,
        sk: key.sk,
        gsi1Pk: extra.gsi1Pk ?? null,
        gsi1Sk: extra.gsi1Sk ?? null,
        gsiTenantPk: extra.gsiTenantPk ?? null,
        gsiTenantSk: extra.gsiTenantSk ?? null,
        data: data as unknown as Record<string, unknown>,
        expiresAt: extra.expiresAt ?? null
    };

    await db.db
        .insert(items)
        .values(row)
        .onConflictDoUpdate({
            target: [items.pk, items.sk],
            set: {
                gsi1Pk: row.gsi1Pk,
                gsi1Sk: row.gsi1Sk,
                gsiTenantPk: row.gsiTenantPk,
                gsiTenantSk: row.gsiTenantSk,
                data: row.data,
                expiresAt: row.expiresAt
            }
        });
};

export const deleteRow = async (db: Database, key: PrimaryKey): Promise<void> => {
    await db.db.delete(items).where(and(eq(items.pk, key.pk), eq(items.sk, key.sk)));
};
