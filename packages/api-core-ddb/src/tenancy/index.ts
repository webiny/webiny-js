import { batchReadAll, createEntityWriteBatch, createTableWriteBatch } from "@webiny/db-dynamodb";
import type { QueryAllParams } from "@webiny/db-dynamodb/utils/query.js";
import { queryAll } from "@webiny/db-dynamodb/utils/query.js";
import WebinyError from "@webiny/error";
import { createTable } from "./definitions/table.js";
import { createTenantEntity } from "./definitions/tenantEntity.js";
import type { CreateTenancyStorageOperations } from "./types.js";
import { ENTITIES } from "./types.js";
import type { ListTenantsParams, Tenant } from "@webiny/api-core/types/tenancy.js";

const setTenantDefaults = (item: Tenant) => {
    if (!item.tags) {
        item.tags = [];
    }

    if (!item.description) {
        item.description = "";
    }

    return item;
};

export const createStorageOperations: CreateTenancyStorageOperations = params => {
    const { documentClient } = params;

    const tableInstance = createTable({ documentClient });

    const entities = {
        tenants: createTenantEntity({
            entityName: ENTITIES.TENANT,
            table: tableInstance
        })
    };

    return {
        getTable() {
            return tableInstance;
        },
        getEntities() {
            return entities;
        },

        async getTenantsByIds(ids: string[]): Promise<Tenant[]> {
            const items = ids.map(id => entities.tenants.getBatch({ PK: `T#${id}`, SK: "A" }));

            const tenants = await batchReadAll<{ data: Tenant }>({ table: tableInstance, items });

            return tenants.map(item => item.data).map(item => setTenantDefaults(item) as Tenant);
        },

        async listTenants(params: ListTenantsParams = {}): Promise<Tenant[]> {
            const { parent } = params;

            const options: QueryAllParams["options"] = {
                index: "GSI1"
            };

            if (parent) {
                options.beginsWith = `T#${parent}#`;
            } else {
                options.gt = " ";
            }

            const tenants = await queryAll<{ data: Tenant }>({
                entity: entities.tenants,
                partitionKey: `TENANTS`,
                options
            });

            return tenants.map(item => item.data).map(item => setTenantDefaults(item) as Tenant);
        },

        async createTenant(data: Tenant): Promise<Tenant> {
            const keys = {
                PK: `T#${data.id}`,
                SK: "A",
                GSI1_PK: "TENANTS",
                GSI1_SK: `T#${data.parent}#${data.createdOn}`
            };

            try {
                const tableWrite = createTableWriteBatch({
                    table: tableInstance
                });

                tableWrite.put(entities.tenants, {
                    TYPE: "tenancy.tenant",
                    ...keys,
                    data
                });

                await tableWrite.execute();

                return data as Tenant;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not create tenant record.",
                    code: "CREATE_TENANT_ERROR",
                    data: { keys, data }
                });
            }
        },

        async updateTenant(data: Tenant): Promise<Tenant> {
            const tenantPK = `T#${data.id}`;

            const keys = {
                PK: tenantPK,
                SK: "A",
                GSI1_PK: "TENANTS",
                GSI1_SK: `T#${data.parent}#${data.createdOn}`
            };

            const tableWrite = createTableWriteBatch({
                table: tableInstance
            });

            tableWrite.put(entities.tenants, { ...keys, data });

            try {
                await tableWrite.execute();
                return data as Tenant;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not update tenant record.",
                    code: "CREATE_TENANT_ERROR",
                    data: { keys, data }
                });
            }
        },

        async deleteTenant(id: string): Promise<void> {
            const batchWrite = createEntityWriteBatch({
                entity: entities.tenants,
                delete: [
                    {
                        PK: `T#${id}`,
                        SK: "A"
                    }
                ]
            });

            // Delete tenant and domain items
            await batchWrite.execute();
        }
    };
};
