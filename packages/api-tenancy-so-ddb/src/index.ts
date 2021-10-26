import { batchReadAll } from "@webiny/db-dynamodb/utils/batchRead";
import { cleanupItem, cleanupItems } from "@webiny/db-dynamodb/utils/cleanup";
import { queryAll } from "@webiny/db-dynamodb/utils/query";
import Error from "@webiny/error";
import { createTable } from "~/definitions/table";
import { createTenantEntity } from "~/definitions/tenantEntity";
import { createSystemEntity } from "~/definitions/systemEntity";
import { CreateTenancyStorageOperations, ENTITIES } from "~/types";
import { System, Tenant } from "@webiny/api-tenancy/types";

const reservedFields = ["PK", "SK", "index", "data"];

const isReserved = name => {
    if (reservedFields.includes(name)) {
        throw new Error(`Attribute name "${name}" is not allowed.`, "ATTRIBUTE_NOT_ALLOWED", {
            name
        });
    }
};

export const createStorageOperations: CreateTenancyStorageOperations = params => {
    const { table, documentClient, attributes = {} } = params;

    if (attributes) {
        Object.values(attributes).forEach(attrs => {
            Object.keys(attrs).forEach(isReserved);
        });
    }

    const tableInstance = createTable({ table, documentClient });

    const entities = {
        tenants: createTenantEntity({
            entityName: ENTITIES.TENANT,
            table: tableInstance,
            attributes: attributes[ENTITIES.TENANT]
        }),
        system: createSystemEntity({
            entityName: ENTITIES.SYSTEM,
            table: tableInstance,
            attributes: attributes[ENTITIES.SYSTEM]
        })
    };

    const systemKeys = {
        PK: "T#root#SYSTEM",
        SK: "TENANCY"
    };

    return {
        getTable() {
            return tableInstance;
        },
        getEntities() {
            return entities;
        },
        async createSystemData(data: System) {
            try {
                await entities.system.put({
                    ...systemKeys,
                    ...data
                });
                return data;
            } catch (err) {
                throw Error.from(err, {
                    message: "Could not create system record.",
                    code: "CREATE_SYSTEM_ERROR",
                    data: { keys: systemKeys, data }
                });
            }
        },
        async getSystemData(): Promise<System> {
            try {
                const result = await entities.system.get(systemKeys);
                if (!result || !result.Item) {
                    return null;
                }
                return cleanupItem(entities.system, result.Item);
            } catch (err) {
                throw Error.from(err, {
                    message: "Could not load system record.",
                    code: "GET_SYSTEM_ERROR",
                    data: { keys: systemKeys }
                });
            }
        },
        async updateSystemData(data: System): Promise<System> {
            try {
                await entities.system.put({
                    ...systemKeys,
                    ...data
                });
                return data;
            } catch (err) {
                throw Error.from(err, {
                    message: "Could not update system record.",
                    code: "UPDATE_SYSTEM_ERROR",
                    data: { keys: systemKeys, data }
                });
            }
        },

        async getTenantsByIds<TTenant extends Tenant = Tenant>(ids: string[]): Promise<TTenant[]> {
            const items = ids.map(id => entities.tenants.getBatch({ PK: `T#${id}`, SK: "A" }));

            const tenants = await batchReadAll<TTenant>({ table: tableInstance, items });

            return cleanupItems(entities.tenants, tenants);
        },

        async listTenants<TTenant extends Tenant = Tenant>({ parent }): Promise<TTenant[]> {
            const tenants = await queryAll<TTenant>({
                entity: entities.tenants,
                partitionKey: `T#${parent}`,
                options: {
                    index: "GSI1",
                    beginsWith: "T#"
                }
            });

            return cleanupItems(entities.tenants, tenants);
        },

        async createTenant<TTenant extends Tenant = Tenant>(data: TTenant): Promise<TTenant> {
            const keys = {
                PK: `T#${data.id}`,
                SK: "A",
                GSI1_PK: data.parent ? `T#${data.parent}` : undefined,
                GSI1_SK: data.parent ? `T#${data.id}` : undefined
            };
            try {
                await entities.tenants.put({
                    ...keys,
                    ...data
                });
                return data as TTenant;
            } catch (err) {
                throw Error.from(err, {
                    message: "Could not create tenant record.",
                    code: "CREATE_TENANT_ERROR",
                    data: { keys, data }
                });
            }
        },

        async updateTenant<TTenant extends Tenant = Tenant>(data: TTenant): Promise<TTenant> {
            const keys = {
                PK: `T#${data.id}`,
                SK: "A",
                GSI1_PK: data.parent ? `T#${data.parent}` : undefined,
                GSI1_SK: data.parent ? `T#${data.id}` : undefined
            };
            try {
                await entities.tenants.update({
                    ...keys,
                    ...data
                });
                return data as TTenant;
            } catch (err) {
                throw Error.from(err, {
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
