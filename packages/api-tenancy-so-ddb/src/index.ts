import { System, Tenant } from "@webiny/api-tenancy/types";
import { batchReadAll } from "@webiny/db-dynamodb/utils/batchRead";
import { cleanupItem, cleanupItems } from "@webiny/db-dynamodb/utils/cleanup";
import { queryAll } from "@webiny/db-dynamodb/utils/query";
import Error from "@webiny/error";
import { createTable } from "~/definitions/table";
import { createTenantEntity } from "~/definitions/tenantEntity";
import { CreateTenancyStorageOperationsFactory, ENTITIES } from "~/types";
import { createSystemEntity } from "~/definitions/systemEntity";

const reservedFields = ["PK", "SK", "index", "data"];

const isReserved = name => {
    if (reservedFields.includes(name)) {
        throw new Error(`Attribute name "${name}" is not allowed.`, "ATTRIBUTE_NOT_ALLOWED", {
            name
        });
    }
};

export const createStorageOperationsFactory: CreateTenancyStorageOperationsFactory = params => {
    return () => {
        const { table: tableName, documentClient, attributes = {}} = params;

        if (attributes) {
            Object.values(attributes).forEach(attrs => {
                Object.keys(attrs).forEach(isReserved);
            });
        }

        const table = createTable({ table: tableName, documentClient });

        const entities = {
            tenants: createTenantEntity({
                entityName: ENTITIES.TENANT,
                table,
                attributes: attributes[ENTITIES.TENANT]
            }),
            system: createSystemEntity({
                entityName: ENTITIES.TENANT,
                table,
                attributes: attributes[ENTITIES.SYSTEM]
            })
        };
        
        const systemKeys = {
            PK: "T#root#SYSTEM",
            SK: "TENANCY"
        };

        return {
            getTable() {
                return table;
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
                } catch (ex) {
                    throw new Error(
                        ex.message || "Could not create system record.",
                        ex.code || "CREATE_SYSTEM_ERROR",
                        { keys: systemKeys, data }
                    );
                }
            },
            async getSystemData(): Promise<System> {
                try {
                    const result = await entities.system.get(systemKeys);
                    if (!result || !result.Item) {
                        return null;
                    }
                    return cleanupItem(entities.system, result.Item);
                } catch (ex) {
                    throw new Error(
                        ex.message || "Could not load system record.",
                        ex.code || "GET_SYSTEM_ERROR",
                        { keys: systemKeys }
                    );
                }
            },
            async updateSystemData(data: System): Promise<System> {
                try {
                    await entities.system.put({
                        ...systemKeys,
                        ...data
                    });
                    return data;
                } catch (ex) {
                    throw new Error(
                        ex.message || "Could not update system record.",
                        ex.code || "UPDATE_SYSTEM_ERROR",
                        { keys: systemKeys, data }
                    );
                }
            },

            async getTenantsByIds<TTenant extends Tenant = Tenant>(
                ids: string[]
            ): Promise<TTenant[]> {
                const items = ids.map(id => entities.tenants.getBatch({ PK: `T#${id}`, SK: "A" }));

                const tenants = await batchReadAll<TTenant>({ table, items });

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
                } catch (ex) {
                    throw new Error(
                        ex.message || "Could not create tenant record.",
                        ex.code || "CREATE_TENANT_ERROR",
                        { keys, data }
                    );
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
                } catch (ex) {
                    throw new Error(
                        ex.message || "Could not update tenant record.",
                        ex.code || "CREATE_TENANT_ERROR",
                        { keys, data }
                    );
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
};
