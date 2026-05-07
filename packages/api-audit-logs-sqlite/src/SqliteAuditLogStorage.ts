import { and, asc, desc, eq } from "drizzle-orm";
import { items, type Database } from "@webiny/db-sqlite";
import { WebinyError } from "@webiny/error";
import type {
    IStorage,
    IStorageFetchParams,
    IStorageFetchResult,
    IStorageListParams,
    IStorageListResult,
    IStorageStoreParams,
    IStorageStoreResult
} from "@webiny/api-audit-logs";
import type { IAuditLog } from "@webiny/api-audit-logs";

interface ListPredicate {
    app?: string;
    createdBy?: string;
    entity?: string;
    entityId?: string;
    action?: string;
    createdOn_gte?: Date;
    createdOn_lte?: Date;
}

const primaryKey = (tenant: string, id: string) => ({
    pk: `T#${tenant}#AL`,
    sk: id
});

const decodeCursor = (after?: string): string | null => {
    if (!after) {
        return null;
    }
    try {
        return Buffer.from(after, "base64url").toString("utf8");
    } catch {
        return null;
    }
};

const encodeCursor = (sk: string): string => Buffer.from(sk, "utf8").toString("base64url");

/**
 * SQLite-backed audit-log storage.
 *
 * Trade-offs documented up front:
 *   - `store` and `fetch` are direct single-row CRUD — full parity with
 *     the DDB version.
 *   - `list` defaults to a chronological scan of the tenant partition
 *     (PK = `T#<tenant>#AL`, ordered by `sk` which is the audit-log id —
 *     a sortable string). The DDB version uses 10 different GSIs to make
 *     each filter shape (by app, by createdBy, by entity+action+createdBy,
 *     etc.) into an O(log n) index seek; we don't have that, so the SQLite
 *     version pulls the partition and filters in memory. Acceptable for
 *     POC-scale audit-log volume; scale-out belongs to a separate phase
 *     that adds the additional index columns to db-sqlite.
 *   - `after`-cursor pagination is supported (encoded `sk`).
 */
export class SqliteAuditLogStorage implements IStorage {
    public constructor(private readonly db: Database) {}

    public async store(params: IStorageStoreParams): Promise<IStorageStoreResult> {
        const { data } = params;
        try {
            const { pk, sk } = primaryKey(data.tenant, data.id);
            const expiresAt =
                data.expiresAt instanceof Date ? Math.floor(data.expiresAt.getTime() / 1000) : null;

            await this.db.db
                .insert(items)
                .values({
                    pk,
                    sk,
                    gsi1Pk: `T#${data.tenant}#AL#APP`,
                    gsi1Sk: `${data.app}#${sk}`,
                    gsiTenantPk: data.tenant,
                    gsiTenantSk: null,
                    data: data as unknown as Record<string, unknown>,
                    expiresAt
                })
                .onConflictDoUpdate({
                    target: [items.pk, items.sk],
                    set: {
                        gsi1Pk: `T#${data.tenant}#AL#APP`,
                        gsi1Sk: `${data.app}#${sk}`,
                        gsiTenantPk: data.tenant,
                        data: data as unknown as Record<string, unknown>,
                        expiresAt
                    }
                });

            return { success: true, data };
        } catch (err) {
            return { success: false, error: err as Error };
        }
    }

    public async fetch(params: IStorageFetchParams): Promise<IStorageFetchResult> {
        try {
            const { pk, sk } = primaryKey(params.tenant, params.id);
            const rows = await this.db.db
                .select({ data: items.data })
                .from(items)
                .where(and(eq(items.pk, pk), eq(items.sk, sk)))
                .limit(1);

            if (rows.length === 0) {
                return {
                    success: false,
                    error: new WebinyError("Audit log not found.", "NOT_FOUND")
                };
            }

            return { success: true, data: rows[0]!.data as unknown as IAuditLog };
        } catch (err) {
            return { success: false, error: err as Error };
        }
    }

    public async list(params: IStorageListParams): Promise<IStorageListResult> {
        try {
            const direction = params.sort === "ASC" ? asc(items.sk) : desc(items.sk);
            const allRows = await this.db.db
                .select({ data: items.data, sk: items.sk })
                .from(items)
                .where(eq(items.pk, `T#${params.tenant}#AL`))
                .orderBy(direction);

            const filtered = allRows
                .map(r => ({ sk: r.sk, log: r.data as unknown as IAuditLog }))
                .filter(({ log }) => SqliteAuditLogStorage.matchesPredicate(log, params));

            const cursorSk = decodeCursor(params.after);
            const startIdx = cursorSk ? filtered.findIndex(r => r.sk === cursorSk) + 1 : 0;

            const limit = params.limit ?? 50;
            const page = filtered.slice(startIdx, startIdx + limit);
            const hasMore = startIdx + page.length < filtered.length;

            return {
                success: true,
                data: page.map(r => r.log),
                meta: {
                    hasMoreItems: hasMore,
                    after: hasMore && page.length > 0 ? encodeCursor(page.at(-1)!.sk) : undefined
                }
            };
        } catch (err) {
            return { success: false, error: err as Error };
        }
    }

    /**
     * In-memory filter mirroring the DDB GSI-driven query patterns. Exposed
     * as a static method so it's straightforward to unit-test without a
     * full SQLite instance.
     */
    private static matchesPredicate(log: IAuditLog, params: IStorageListParams): boolean {
        const p = params as IStorageListParams & ListPredicate;

        if (p.app !== undefined && log.app !== p.app) {
            return false;
        }
        if (p.createdBy !== undefined && log.createdBy?.id !== p.createdBy) {
            return false;
        }
        if (p.entity !== undefined && log.entity !== p.entity) {
            return false;
        }
        if (p.entityId !== undefined && log.entityId !== p.entityId) {
            return false;
        }
        if (p.action !== undefined && log.action !== p.action) {
            return false;
        }
        if (p.createdOn_gte !== undefined) {
            const created = new Date(log.createdOn);
            if (created < p.createdOn_gte) {
                return false;
            }
        }
        if (p.createdOn_lte !== undefined) {
            const created = new Date(log.createdOn);
            if (created > p.createdOn_lte) {
                return false;
            }
        }
        return true;
    }
}

export const createSqliteAuditLogStorage = (db: Database): IStorage => {
    return new SqliteAuditLogStorage(db);
};
