import { batchReadAll, createEntityWriteBatch, createTableWriteBatch } from "@webiny/db-dynamodb";
import type { QueryAllParams } from "@webiny/db-dynamodb/utils/query.js";
import { queryAll } from "@webiny/db-dynamodb/utils/query.js";
import WebinyError from "@webiny/error";
import { createTable } from "~/definitions/table.js";
import { createTenantEntity } from "~/definitions/tenantEntity.js";
import { createDomainEntity } from "~/definitions/domainEntity.js";
import type { CreateTenancyStorageOperations } from "~/types.js";
import { ENTITIES } from "~/types.js";
import type { ListTenantsParams, Tenant, TenantDomain } from "@webiny/api-tenancy/types.js";

interface TenantDomainRecord {
    PK: string;
    SK: string;
    GSI1_PK: string;
    GSI1_SK: string;
    data: {
        tenant: string;
        fqdn: string;
        webinyVersion: string;
    }
}

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
    const { table, documentClient } = params;

    const tableInstance = createTable({ table, documentClient });

    const entities = {
        tenants: createTenantEntity({
            entityName: ENTITIES.TENANT,
            table: tableInstance
        }),
        domains: createDomainEntity({
            entityName: ENTITIES.DOMAIN,
            table: tableInstance
        })
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
                    data: {
                        tenant: tenant.id,
                        fqdn,
                        webinyVersion: tenant.webinyVersion as string
                    }
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

                const newDomains = createNewDomainsRecords(data);

                for (const domain of newDomains) {
                    tableWrite.put(entities.domains, domain);
                }

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

            const existingDomains = await queryAll<TenantDomain>({
                entity: entities.domains,
                partitionKey: "DOMAINS",
                options: {
                    index: "GSI1",
                    beginsWith: `T#${data.id}`
                }
            });

            const newDomains = createNewDomainsRecords(data, existingDomains);

            const tableWrite = createTableWriteBatch({
                table: tableInstance
            });

            tableWrite.put(entities.tenants, { ...keys, data });

            // Delete domains that are in the DB but are NOT in the settings.

            for (const { fqdn } of existingDomains) {
                if (data.settings.domains.some(d => d.fqdn === fqdn)) {
                    continue;
                }
                tableWrite.delete(entities.domains, {
                    PK: `DOMAIN#${fqdn}`,
                    SK: `A`
                });
            }

            for (const domain of newDomains) {
                tableWrite.put(entities.domains, domain);
            }

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
            const existingDomains = await queryAll<TenantDomain>({
                entity: entities.domains,
                partitionKey: "DOMAINS",
                options: {
                    index: "GSI1",
                    beginsWith: `T#${id}`
                }
            });

            const batchWrite = createEntityWriteBatch({
                entity: entities.tenants,
                delete: [
                    {
                        PK: `T#${id}`,
                        SK: "A"
                    }
                ]
            });

            for (const domain of existingDomains) {
                batchWrite.delete({
                    PK: domain.PK,
                    SK: domain.SK
                });
            }

            // Delete tenant and domain items
            await batchWrite.execute();
        }
    };
};
