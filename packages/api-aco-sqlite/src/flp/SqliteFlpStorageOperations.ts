import { and, asc, eq } from "drizzle-orm";
import { items, type Database, beginsWith } from "@webiny/db-sqlite";
import { WebinyError } from "@webiny/error";
import type {
    AcoFolderLevelPermissionsStorageOperations as IAcoFolderLevelPermissionsStorageOperations,
    FolderLevelPermission,
    StorageOperationsBatchUpdateFlpParams,
    StorageOperationsCreateFlpParams,
    StorageOperationsDeleteFlpParams,
    StorageOperationsGetFlpParams,
    StorageOperationsListFlpsParams,
    StorageOperationsUpdateFlpParams
} from "@webiny/api-aco/flp/flp.types.js";

interface KeyParams {
    tenant: string;
    id: string;
}

const primaryKey = ({ tenant, id }: KeyParams) => ({
    pk: `T#${tenant}#FLP#${id}`,
    sk: "A"
});

const gsi1Pk = (tenant: string, type: string) => `T#${tenant}#AT#${type}#FLP`;
const gsi1Sk = (path: string) => path;

/**
 * SQLite-backed implementation of the ACO Folder Level Permissions storage
 * operations. Mirrors the DDB key layout (T#tenant#FLP#id / A) so the
 * semantics of every list/get/create/update/delete match the DDB version.
 *
 * One concession: the DDB version uses a second GSI (GSI2) for `parentId`
 * lookups; @webiny/db-sqlite's single-table schema only carries gsi1 +
 * gsi_tenant. The `parentId` query path falls back to scanning the gsi1
 * partition and filtering in memory — acceptable because FLP records are
 * tens-to-hundreds per tenant, not millions.
 */
export class SqliteFlpStorageOperations implements IAcoFolderLevelPermissionsStorageOperations {
    public constructor(private readonly db: Database) {}

    public async list({
        where: { tenant, type, path_startsWith, parentId }
    }: StorageOperationsListFlpsParams): Promise<FolderLevelPermission[]> {
        try {
            if (parentId) {
                // Fallback scan: pull all FLPs for the tenant + type and
                // filter by parentId in memory. Volume is small enough for
                // this to be acceptable for the POC.
                const rows = await this.db.db
                    .select({ data: items.data })
                    .from(items)
                    .where(eq(items.gsi1Pk, gsi1Pk(tenant, type)));
                return rows
                    .map(r => r.data as unknown as FolderLevelPermission)
                    .filter(flp => flp.parentId === parentId);
            }

            if (path_startsWith) {
                const rows = await this.db.db
                    .select({ data: items.data })
                    .from(items)
                    .where(
                        and(
                            eq(items.gsi1Pk, gsi1Pk(tenant, type)),
                            beginsWith(items.gsi1Sk, path_startsWith)
                        )
                    )
                    .orderBy(asc(items.gsi1Sk));
                return rows.map(r => r.data as unknown as FolderLevelPermission);
            }

            throw new WebinyError("Missing required parameters.", "LIST_FLP_MISSING_PARAMETERS", {
                tenant,
                type
            });
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not list folder level permissions.",
                code: "LIST_FLP_ERROR"
            });
        }
    }

    public async get({
        tenant,
        id
    }: StorageOperationsGetFlpParams): Promise<FolderLevelPermission | null> {
        try {
            const key = primaryKey({ tenant, id });
            const rows = await this.db.db
                .select({ data: items.data })
                .from(items)
                .where(and(eq(items.pk, key.pk), eq(items.sk, key.sk)))
                .limit(1);
            if (rows.length === 0) {
                return null;
            }
            return rows[0]!.data as unknown as FolderLevelPermission;
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not load folder level permission.",
                code: "GET_FLP_ERROR",
                data: { tenant, id }
            });
        }
    }

    public async create({
        data
    }: StorageOperationsCreateFlpParams): Promise<FolderLevelPermission> {
        try {
            await this.write(data);
            return data;
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not create folder level permission.",
                code: "CREATE_FLP_ERROR"
            });
        }
    }

    public async update({
        data: input,
        original
    }: StorageOperationsUpdateFlpParams): Promise<FolderLevelPermission> {
        try {
            const data = { ...original, ...input };
            await this.write(data);
            return data;
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not update folder level permission.",
                code: "UPDATE_FLP_ERROR"
            });
        }
    }

    public async delete({ flp }: StorageOperationsDeleteFlpParams): Promise<void> {
        const key = primaryKey({ tenant: flp.tenant, id: flp.id });
        await this.db.db.delete(items).where(and(eq(items.pk, key.pk), eq(items.sk, key.sk)));
    }

    public async batchUpdate({
        items: updates
    }: StorageOperationsBatchUpdateFlpParams): Promise<FolderLevelPermission[]> {
        try {
            const updated: FolderLevelPermission[] = [];
            // Drizzle's better-sqlite3 driver supports synchronous transactions
            // wrapping async writes; we keep this simple and serial.
            for (const { original, data: input } of updates) {
                const data = { ...original, ...input };
                await this.write(data);
                updated.push(data);
            }
            return updated;
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not batch update folder level permissions.",
                code: "BATCH_UPDATE_FLP_ERROR"
            });
        }
    }

    private async write(data: FolderLevelPermission & { tenant: string }): Promise<void> {
        const { pk, sk } = primaryKey({ tenant: data.tenant, id: data.id });
        const row = {
            pk,
            sk,
            gsi1Pk: gsi1Pk(data.tenant, data.type),
            gsi1Sk: gsi1Sk(data.path),
            gsiTenantPk: data.tenant,
            gsiTenantSk: null,
            data: data as unknown as Record<string, unknown>,
            expiresAt: null
        };
        await this.db.db
            .insert(items)
            .values(row)
            .onConflictDoUpdate({
                target: [items.pk, items.sk],
                set: {
                    gsi1Pk: row.gsi1Pk,
                    gsi1Sk: row.gsi1Sk,
                    gsiTenantPk: row.gsiTenantPk,
                    data: row.data
                }
            });
    }
}

export const createFlpOperations = (db: Database): IAcoFolderLevelPermissionsStorageOperations => {
    return new SqliteFlpStorageOperations(db);
};
