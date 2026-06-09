import type { Knex } from "knex";
import type {
    ListTenantsParams,
    Tenant,
    TenancyStorageOperations
} from "@webiny/api-core/types/tenancy.js";
import WebinyError from "@webiny/error";
import type { TableManager } from "~/TableManager.js";

const TABLE_NAME = "webiny_core_tenants";

interface ITenantRow {
    id: string;
    parent: string | null;
    createdOn: string;
    data: string;
}

const tenantToRow = (tenant: Tenant): ITenantRow => {
    return {
        id: tenant.id,
        parent: tenant.parent,
        createdOn: tenant.createdOn,
        data: JSON.stringify(tenant)
    };
};

const rowToTenant = (row: ITenantRow): Tenant => {
    const tenant = JSON.parse(row.data) as Tenant;

    if (!tenant.tags) {
        tenant.tags = [];
    }

    if (!tenant.description) {
        tenant.description = "";
    }

    return tenant;
};

interface CreateStorageOperationsParams {
    knex: Knex;
    tableManager: TableManager;
}

export const createStorageOperations = (
    params: CreateStorageOperationsParams
): TenancyStorageOperations => {
    const { knex, tableManager } = params;

    const ensureTable = () => {
        return tableManager.ensure(TABLE_NAME, table => {
            table.text("id").primary().notNullable();
            table.text("parent");
            table.text("createdOn").notNullable();
            table.text("data").notNullable();

            table.index(["parent"]);
        });
    };

    const query = () => {
        return knex<ITenantRow>(TABLE_NAME);
    };

    return {
        async getTenantsByIds(ids: readonly string[]): Promise<Tenant[]> {
            await ensureTable();

            try {
                const rows = await query().whereIn("id", ids as string[]);

                return rows.map(rowToTenant);
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not get tenants by IDs.",
                    code: "GET_TENANTS_BY_IDS_ERROR",
                    data: { ids }
                });
            }
        },

        async listTenants(params: ListTenantsParams = {}): Promise<Tenant[]> {
            await ensureTable();

            try {
                const qb = query();

                if (params.parent) {
                    qb.where("parent", params.parent);
                }

                qb.orderBy("createdOn", "asc");

                const rows = await qb;

                return rows.map(rowToTenant);
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not list tenants.",
                    code: "LIST_TENANTS_ERROR",
                    data: { params }
                });
            }
        },

        async createTenant(data: Tenant): Promise<Tenant> {
            await ensureTable();

            try {
                const row = tenantToRow(data);
                await query().insert(row);

                return data;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not create tenant record.",
                    code: "CREATE_TENANT_ERROR",
                    data: { tenant: data }
                });
            }
        },

        async updateTenant(data: Tenant): Promise<Tenant> {
            await ensureTable();

            try {
                const row = tenantToRow(data);
                await query().where("id", data.id).update(row);

                return data;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not update tenant record.",
                    code: "UPDATE_TENANT_ERROR",
                    data: { tenant: data }
                });
            }
        },

        async deleteTenant(id: string): Promise<void> {
            await ensureTable();

            try {
                await query().where("id", id).delete();
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not delete tenant record.",
                    code: "DELETE_TENANT_ERROR",
                    data: { id }
                });
            }
        }
    };
};
