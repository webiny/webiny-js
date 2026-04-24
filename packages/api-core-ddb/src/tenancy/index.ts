import { createTable, type IEntityQueryAllParams } from "@webiny/db-dynamodb";
import WebinyError from "@webiny/error";
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

    const tableInstance = createTable({
        name: (process.env.DB_TABLE_TENANCY || process.env.DB_TABLE) as string,
        documentClient
    });

    const entities = {
        tenants: createTenantEntity({
            entityName: ENTITIES.TENANT,
            table: tableInstance.table
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
            const batchReader = entities.tenants.createEntityReader({
                read: ids.map(id => {
                    return {
                        PK: `T#${id}`,
                        SK: "A"
                    };
                })
            });
            const tenants = await batchReader.execute();

            return tenants
                .map(item => {
                    return item.data;
                })
                .map(item => {
                    return setTenantDefaults(item);
                });
        },

        async listTenants(params: ListTenantsParams = {}): Promise<Tenant[]> {
            const { parent } = params;

            const options: IEntityQueryAllParams["options"] = {
                index: "GSI1"
            };

            if (parent) {
                options.beginsWith = `T#${parent}#`;
            } else {
                options.gt = " ";
            }

            const tenants = await entities.tenants.queryAll({
                partitionKey: `TENANTS`,
                options
            });

            return tenants
                .map(item => {
                    return item.data;
                })
                .map(item => {
                    return setTenantDefaults(item);
                });
        },

        async createTenant(data: Tenant): Promise<Tenant> {
            const keys = {
                PK: `T#${data.id}`,
                SK: "A",
                GSI1_PK: "TENANTS",
                GSI1_SK: `T#${data.parent}#${data.createdOn}`,
                GSI_TENANT: data.id
            };

            try {
                await entities.tenants.put({
                    TYPE: "tenancy.tenant",
                    ...keys,
                    data
                });

                return data;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not create tenant record.",
                    code: "CREATE_TENANT_ERROR",
                    data: {
                        keys,
                        data
                    }
                });
            }
        },

        async updateTenant(data: Tenant): Promise<Tenant> {
            const tenantPK = `T#${data.id}`;

            const keys = {
                PK: tenantPK,
                SK: "A",
                GSI1_PK: "TENANTS",
                GSI1_SK: `T#${data.parent}#${data.createdOn}`,
                GSI_TENANT: data.id,
                TYPE: "tenancy.tenant"
            };

            try {
                await entities.tenants.put({
                    ...keys,
                    data
                });
                return data;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not update tenant record.",
                    code: "CREATE_TENANT_ERROR",
                    data: { keys, data }
                });
            }
        },

        async deleteTenant(id: string): Promise<void> {
            await entities.tenants.delete({
                PK: `T#${id}`,
                SK: "A"
            });
        }
    };
};
