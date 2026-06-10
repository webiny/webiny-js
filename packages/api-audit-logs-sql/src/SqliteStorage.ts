import type { Knex } from "knex";
import type { TableManager } from "@webiny/api-core-sql/TableManager.js";
import type { IAuditLog, IAuditLogCreatedBy } from "@webiny/api-audit-logs/storage/types.js";
import type {
    IStorage,
    IStorageFetchParams,
    IStorageFetchResult,
    IStorageStoreParams,
    IStorageStoreResult,
    IStorageListParams,
    IStorageListResult
} from "@webiny/api-audit-logs/storage/abstractions/Storage.js";

interface AuditLogRow {
    id: string;
    tenant: string;
    createdBy: string;
    createdOn: string;
    app: string;
    action: string;
    message: string;
    entity: string;
    entityId: string;
    tags: string;
    expiresAt: string;
    content: string;
}

const TABLE_NAME = "webiny_audit_logs";

/* Convert an IAuditLog to a flat database row. */
const toRow = (data: IAuditLog): AuditLogRow => {
    return {
        id: data.id,
        tenant: data.tenant,
        createdBy: JSON.stringify(data.createdBy),
        createdOn: data.createdOn.toISOString(),
        app: data.app,
        action: data.action,
        message: data.message,
        entity: data.entity,
        entityId: data.entityId,
        tags: JSON.stringify(data.tags),
        expiresAt: data.expiresAt.toISOString(),
        content: data.content
    };
};

/* Convert a database row back to an IAuditLog. */
const fromRow = (row: AuditLogRow): IAuditLog => {
    return {
        id: row.id,
        tenant: row.tenant,
        createdBy: JSON.parse(row.createdBy) as IAuditLogCreatedBy,
        createdOn: new Date(row.createdOn),
        app: row.app,
        action: row.action,
        message: row.message,
        entity: row.entity,
        entityId: row.entityId,
        tags: JSON.parse(row.tags) as string[],
        expiresAt: new Date(row.expiresAt),
        content: row.content
    };
};

export class SqliteStorage implements IStorage {
    private readonly knex: Knex;
    private readonly tableManager: TableManager;

    public constructor(params: { knex: Knex; tableManager: TableManager }) {
        this.knex = params.knex;
        this.tableManager = params.tableManager;
    }

    public async fetch(params: IStorageFetchParams): Promise<IStorageFetchResult> {
        await this.ensureTable();

        try {
            const row = await this.knex<AuditLogRow>(this.tableManager.resolve(TABLE_NAME))
                .where("id", params.id)
                .andWhere("tenant", params.tenant)
                .first();

            if (!row) {
                return {
                    error: new Error(`Audit log with id "${params.id}" not found.`),
                    success: false
                };
            }

            const auditLog = fromRow(row);

            return {
                data: auditLog,
                success: true
            };
        } catch (error) {
            return {
                error: error as Error,
                success: false
            };
        }
    }

    public async store(params: IStorageStoreParams): Promise<IStorageStoreResult> {
        await this.ensureTable();

        try {
            const row = toRow(params.data);

            const existing = await this.knex<AuditLogRow>(this.tableManager.resolve(TABLE_NAME))
                .where("id", params.data.id)
                .first();

            if (existing) {
                await this.knex<AuditLogRow>(this.tableManager.resolve(TABLE_NAME))
                    .where("id", params.data.id)
                    .update(row);
            } else {
                await this.knex<AuditLogRow>(this.tableManager.resolve(TABLE_NAME)).insert(row);
            }

            return {
                data: params.data,
                success: true
            };
        } catch (error) {
            return {
                error: error as Error,
                success: false
            };
        }
    }

    public async list(params: IStorageListParams): Promise<IStorageListResult> {
        await this.ensureTable();

        try {
            const limit = params.limit || 100;

            const query = this.knex<AuditLogRow>(this.tableManager.resolve(TABLE_NAME)).where(
                "tenant",
                params.tenant
            );

            if (params.app) {
                query.andWhere("app", params.app);
            }

            if (params.entity) {
                query.andWhere("entity", params.entity);
            }

            if (params.action) {
                query.andWhere("action", params.action);
            }

            if (params.entityId) {
                /* Match by entity type prefix — strip the record ID after #. */
                const entityPrefix = params.entityId.split("#")[0];
                query.andWhere("entityId", "LIKE", `${entityPrefix}%`);
            }

            if (params.createdBy) {
                query.andWhere("createdBy", "LIKE", `%"id":"${params.createdBy}"%`);
            }

            if ("createdOn_gte" in params && params.createdOn_gte) {
                query.andWhere("createdOn", ">=", params.createdOn_gte.toISOString());
            }

            if ("createdOn_lte" in params && params.createdOn_lte) {
                query.andWhere("createdOn", "<=", params.createdOn_lte.toISOString());
            }

            const sortDirection = params.sort === "DESC" ? "desc" : "asc";

            query.orderBy("createdOn", sortDirection);

            // Fetch one extra row to detect if there are more items.
            query.limit(limit + 1);

            if (params.after) {
                const afterRow = await this.knex<AuditLogRow>(this.tableManager.resolve(TABLE_NAME))
                    .where("id", params.after)
                    .first();

                if (afterRow) {
                    if (sortDirection === "asc") {
                        query.andWhere("createdOn", ">", afterRow.createdOn);
                    } else {
                        query.andWhere("createdOn", "<", afterRow.createdOn);
                    }
                }
            }

            const rows = await query;

            const hasMoreItems = rows.length > limit;

            if (hasMoreItems) {
                rows.pop();
            }

            const data = rows.map(fromRow);

            const lastItem = data[data.length - 1];
            const after = hasMoreItems && lastItem ? lastItem.id : undefined;

            return {
                data,
                meta: {
                    after,
                    hasMoreItems
                },
                success: true
            };
        } catch (error) {
            return {
                error: error as Error,
                success: false
            };
        }
    }

    private async ensureTable(): Promise<void> {
        return this.tableManager.ensure(TABLE_NAME, table => {
            table.text("id").primary();
            table.text("tenant").notNullable();
            table.text("createdBy").notNullable();
            table.datetime("createdOn").notNullable();
            table.text("app").notNullable();
            table.text("action").notNullable();
            table.text("message").notNullable();
            table.text("entity").notNullable();
            table.text("entityId").notNullable();
            table.text("tags").notNullable();
            table.datetime("expiresAt").notNullable();
            table.text("content").notNullable();
        });
    }
}
