import WebinyError from "@webiny/error";
import type { Database } from "@webiny/db-sqlite";
import type {
    ListTenantsParams,
    Tenant,
    TenancyStorageOperations
} from "@webiny/api-core/types/tenancy.js";
import { batchGetByPk, listByGsi1 } from "../utils/scan.js";
import { deleteRow, upsertRow } from "../utils/row.js";

export interface CreateTenancyStorageOperationsParams {
    db: Database;
}

const setTenantDefaults = (item: Tenant): Tenant => {
    if (!item.tags) {
        item.tags = [];
    }
    if (!item.description) {
        item.description = "";
    }
    return item;
};

const tenantKey = (id: string) => ({ pk: `T#${id}`, sk: "A" });

export const createStorageOperations = (
    params: CreateTenancyStorageOperationsParams
): TenancyStorageOperations => {
    const { db } = params;

    return {
        async getTenantsByIds(ids: readonly string[]): Promise<Tenant[]> {
            const keys = [...ids].map(tenantKey);
            const tenants = await batchGetByPk<Tenant>(db, keys);
            return tenants.map(setTenantDefaults);
        },

        async listTenants(p: ListTenantsParams = {}): Promise<Tenant[]> {
            const { parent } = p;
            const tenants = await listByGsi1<Tenant>(db, {
                gsi1Pk: "TENANTS",
                beginsWithSk: parent ? `T#${parent}#` : undefined
            });
            return tenants.map(setTenantDefaults);
        },

        async createTenant(data: Tenant): Promise<Tenant> {
            try {
                await upsertRow(db, tenantKey(data.id), data, {
                    gsi1Pk: "TENANTS",
                    gsi1Sk: `T#${data.parent}#${data.createdOn}`,
                    gsiTenantPk: data.id
                });
                return data;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not create tenant record.",
                    code: "CREATE_TENANT_ERROR",
                    data: { id: data.id }
                });
            }
        },

        async updateTenant(data: Tenant): Promise<Tenant> {
            try {
                await upsertRow(db, tenantKey(data.id), data, {
                    gsi1Pk: "TENANTS",
                    gsi1Sk: `T#${data.parent}#${data.createdOn}`,
                    gsiTenantPk: data.id
                });
                return data;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not update tenant record.",
                    code: "UPDATE_TENANT_ERROR",
                    data: { id: data.id }
                });
            }
        },

        async deleteTenant(id: string): Promise<void> {
            await deleteRow(db, tenantKey(id));
        }
    };
};
