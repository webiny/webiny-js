import type { Knex } from "knex";
import { WebinyError } from "@webiny/error";
import type {
    AcoFolderLevelPermissionsStorageOperations,
    FolderLevelPermission,
    StorageOperationsBatchUpdateFlpParams,
    StorageOperationsCreateFlpParams,
    StorageOperationsDeleteFlpParams,
    StorageOperationsGetFlpParams,
    StorageOperationsListFlpsParams,
    StorageOperationsUpdateFlpParams
} from "@webiny/api-aco/types.js";

interface FlpRow {
    id: string;
    tenant: string;
    type: string;
    slug: string;
    path: string;
    parentId: string;
    permissions: string;
}

const BASE_TABLE_NAME = "webiny_aco_flp";

export interface StorageOperationsConfig {
    knex: Knex;
    tableNamePrefix?: string;
}

export class FolderLevelPermissionsStorageOperations implements AcoFolderLevelPermissionsStorageOperations {
    private readonly knex: Knex;
    private readonly tableName: string;

    constructor({ knex, tableNamePrefix }: StorageOperationsConfig) {
        this.knex = knex;
        this.tableName = tableNamePrefix
            ? `${tableNamePrefix}_${BASE_TABLE_NAME}`
            : BASE_TABLE_NAME;
    }

    public async list({
        where: { tenant, type, path_startsWith, parentId }
    }: StorageOperationsListFlpsParams): Promise<FolderLevelPermission[]> {
        try {
            await this.ensureTable();

            if (parentId) {
                const rows = await this.knex<FlpRow>(this.tableName)
                    .where("tenant", tenant)
                    .andWhere("parentId", parentId);

                return rows.map(row => this.fromRow(row));
            }

            if (path_startsWith) {
                const rows = await this.knex<FlpRow>(this.tableName)
                    .where("tenant", tenant)
                    .andWhere("type", type)
                    .andWhere("path", "like", path_startsWith + "%");

                return rows.map(row => this.fromRow(row));
            }

            throw new WebinyError("Missing required parameters.", "LIST_FLP_MISSING_PARAMETERS", {
                tenant,
                type,
                path_startsWith,
                parentId
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
            await this.ensureTable();

            const row = await this.knex<FlpRow>(this.tableName)
                .where("tenant", tenant)
                .andWhere("id", id)
                .first();

            if (!row) {
                return null;
            }

            return this.fromRow(row);
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
            await this.ensureTable();

            await this.knex<FlpRow>(this.tableName).insert(this.toRow(data));

            return data;
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not create folder level permission.",
                code: "CREATE_FLP_ERROR",
                data: { data }
            });
        }
    }

    public async update({
        data: inputData,
        original
    }: StorageOperationsUpdateFlpParams): Promise<FolderLevelPermission> {
        try {
            await this.ensureTable();

            const data = {
                ...original,
                ...inputData
            };

            await this.knex<FlpRow>(this.tableName)
                .where("tenant", data.tenant)
                .andWhere("id", data.id)
                .update(this.toRow(data));

            return data;
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not update folder level permission.",
                code: "UPDATE_FLP_ERROR",
                data: { inputData, original }
            });
        }
    }

    public async delete({ flp }: StorageOperationsDeleteFlpParams): Promise<void> {
        try {
            await this.ensureTable();

            await this.knex<FlpRow>(this.tableName)
                .where("tenant", flp.tenant)
                .andWhere("id", flp.id)
                .delete();
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not delete folder level permission.",
                code: "DELETE_FLP_ERROR",
                data: { flp }
            });
        }
    }

    public async batchUpdate({
        items
    }: StorageOperationsBatchUpdateFlpParams): Promise<FolderLevelPermission[]> {
        try {
            await this.ensureTable();

            const updatedItems: FolderLevelPermission[] = [];

            await this.knex.transaction(async trx => {
                for (const { original, data: inputData } of items) {
                    const data = {
                        ...original,
                        ...inputData
                    };

                    await trx<FlpRow>(this.tableName)
                        .where("tenant", data.tenant)
                        .andWhere("id", data.id)
                        .update(this.toRow(data));

                    updatedItems.push(data);
                }
            });

            return updatedItems;
        } catch (err) {
            throw WebinyError.from(err, {
                message: "Could not batch update folder level permissions.",
                code: "BATCH_UPDATE_FLP_ERROR",
                data: { items }
            });
        }
    }

    private async ensureTable(): Promise<void> {
        const exists = await this.knex.schema.hasTable(this.tableName);
        if (exists) {
            return;
        }

        await this.knex.schema.createTable(this.tableName, table => {
            table.text("id").notNullable();
            table.text("tenant").notNullable();
            table.text("type").notNullable();
            table.text("slug").notNullable();
            table.text("path").notNullable();
            table.text("parentId").notNullable();
            table.text("permissions").notNullable();
            table.primary(["tenant", "id"]);
        });
    }

    private toRow(data: FolderLevelPermission & { tenant: string }): FlpRow {
        return {
            id: data.id,
            tenant: data.tenant,
            type: data.type,
            slug: data.slug,
            path: data.path,
            parentId: data.parentId,
            permissions: JSON.stringify(data.permissions)
        };
    }

    private fromRow(row: FlpRow): FolderLevelPermission {
        return {
            id: row.id,
            parentId: row.parentId,
            slug: row.slug,
            path: row.path,
            permissions: JSON.parse(row.permissions),
            type: row.type
        };
    }
}
