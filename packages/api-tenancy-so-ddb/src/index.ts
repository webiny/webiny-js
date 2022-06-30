import { batchReadAll } from "@webiny/db-dynamodb/utils/batchRead";
import { batchWriteAll } from "@webiny/db-dynamodb/utils/batchWrite";
import { cleanupItem, cleanupItems } from "@webiny/db-dynamodb/utils/cleanup";
import { queryAll, QueryAllParams } from "@webiny/db-dynamodb/utils/query";
import WebinyError from "@webiny/error";
import { createTable } from "~/definitions/table";
import { createTenantEntity } from "~/definitions/tenantEntity";
import { createSystemEntity } from "~/definitions/systemEntity";
import { createDomainEntity } from "~/definitions/domainEntity";
import { CreateTenancyStorageOperations, ENTITIES } from "~/types";
import { ListTenantsParams, System, Tenant, TenantDomain } from "@webiny/api-tenancy/types";

interface TenantDomainRecord {
    PK: string;
    SK: string;
    GSI1_PK: string;
    GSI1_SK: string;
    tenant: string;
    fqdn: string;
    webinyVersion: string;
}

const reservedFields = ["PK", "SK", "index", "data"];

const isReserved = (name: string): void => {
    if (!reservedFields.includes(name)) {
        return;
    }
    throw new WebinyError(`Attribute name "${name}" is not allowed.`, "ATTRIBUTE_NOT_ALLOWED", {
        name
    });
};

export const createStorageOperations: CreateTenancyStorageOperations = params => {
    const { table, documentClient, attributes } = params;

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
            attributes: attributes ? attributes[ENTITIES.TENANT] : {}
        }),
        domains: createDomainEntity({
            entityName: ENTITIES.DOMAIN,
            table: tableInstance,
            attributes: attributes ? attributes[ENTITIES.DOMAIN] : {}
        }),
        system: createSystemEntity({
            entityName: ENTITIES.SYSTEM,
            table: tableInstance,
            attributes: attributes ? attributes[ENTITIES.SYSTEM] : {}
        })
    };

    const systemKeys = {
        PK: "T#root#SYSTEM",
        SK: "TENANCY"
    };

    const createNewDomainsRecords = (
        tenant: Tenant,
        existingDomains: TenantDomain[] = []
    ): TenantDomainRecord[] => {
        return tenant.settings.domains
            .map(({ fqdn }): TenantDomainRecord | null => {
                // If domain is already in the DB, skip it.
                if (existingDomains.find(d => d.fqdn === fqdn)) {
                    return null;
                }

                // Add a new domain.
                return {
                    PK: `DOMAIN#${fqdn}`,
                    SK: `A`,
                    GSI1_PK: `DOMAINS`,
                    GSI1_SK: `T#${tenant.id}#${fqdn}`,
                    tenant: tenant.id,
                    fqdn,
                    webinyVersion: tenant.webinyVersion as string
                };
            })
            .filter(Boolean) as TenantDomainRecord[];
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
                throw WebinyError.from(err, {
                    message: "Could not create system record.",
                    code: "CREATE_SYSTEM_ERROR",
                    data: { keys: systemKeys, data }
                });
            }
        },
        async getSystemData(): Promise<System | null> {
            try {
                const result = await entities.system.get(systemKeys);
                if (!result || !result.Item) {
                    return null;
                }
                return cleanupItem(entities.system, result.Item);
            } catch (err) {
                throw WebinyError.from(err, {
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
                throw WebinyError.from(err, {
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

        async listTenants<TTenant extends Tenant = Tenant>(
            params: ListTenantsParams = {}
        ): Promise<TTenant[]> {
            const { parent } = params;

            const options: QueryAllParams["options"] = {
                index: "GSI1"
            };

            if (parent) {
                options.beginsWith = `T#${parent}#`;
            } else {
                options.gt = " ";
            }

            const tenants = await queryAll<TTenant>({
                entity: entities.tenants,
                partitionKey: `TENANTS`,
                options
            });

            return cleanupItems(entities.tenants, tenants);
        },

        async createTenant<TTenant extends Tenant = Tenant>(data: TTenant): Promise<TTenant> {
            const keys = {
                PK: `T#${data.id}`,
                SK: "A",
                GSI1_PK: "TENANTS",
                GSI1_SK: `T#${data.parent}#${data.createdOn}`
            };

            try {
                const items: any[] = [
                    entities.tenants.putBatch({ TYPE: "tenancy.tenant", ...keys, ...data })
                ];
                const newDomains = createNewDomainsRecords(data);

                newDomains.forEach(record => {
                    items.push(entities.domains.putBatch(record));
                });

                await batchWriteAll({
                    table: tableInstance,
                    items: items
                });

                return data as TTenant;
            } catch (err) {
                throw WebinyError.from(err, {
                    message: "Could not create tenant record.",
                    code: "CREATE_TENANT_ERROR",
                    data: { keys, data }
                });
            }
        },

        async updateTenant<TTenant extends Tenant = Tenant>(data: TTenant): Promise<TTenant> {
            const tenantPK = `T#${data.id}`;

            const keys = {
                PK: tenantPK,
                SK: "A",
                GSI1_PK: "TENANTS",
                GSI1_SK: `T#${data.parent}#${data.createdOn}`
            };

            const items: any[] = [entities.tenants.putBatch({ ...keys, ...data })];

            const existingDomains = await queryAll<TenantDomain>({
                entity: entities.domains,
                partitionKey: "DOMAINS",
                options: {
                    index: "GSI1",
                    beginsWith: `T#${data.id}`
                }
            });

            const newDomains = createNewDomainsRecords(data, existingDomains);

            // Delete domains that are in the DB but are NOT in the settings.
            const deleteDomains = [];
            for (const { fqdn } of existingDomains) {
                if (!data.settings.domains.find(d => d.fqdn === fqdn)) {
                    deleteDomains.push({
                        PK: `DOMAIN#${fqdn}`,
                        SK: `A`
                    });
                }
            }

            try {
                newDomains.forEach(record => {
                    items.push(entities.domains.putBatch(record));
                });

                deleteDomains.forEach(item => {
                    items.push(entities.domains.deleteBatch(item));
                });

                await batchWriteAll({
                    table: tableInstance,
                    items: items
                });

                return data as TTenant;
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
