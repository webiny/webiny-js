/**
 * Package mdbid does not have types.
 */
// @ts-ignore
import mdbid from "mdbid";
import DataLoader from "dataloader";
import {
    CreateTenantInput,
    Tenant,
    TenancyStorageOperations,
    TenantBeforeCreateEvent,
    TenantAfterCreateEvent,
    TenantBeforeUpdateEvent,
    TenantAfterUpdateEvent,
    TenantBeforeDeleteEvent,
    TenantAfterDeleteEvent,
    Tenancy,
    ListTenantsParams
} from "~/types";
import { createTopic } from "@webiny/pubsub";

function createTenantLoaders(storageOperations: TenancyStorageOperations) {
    const loaders = new Map<string, DataLoader<any, any>>();

    const getTenant = async (ids: readonly string[]) => {
        if (ids.length === 0) {
            return [];
        }

        const tenants = await storageOperations.getTenantsByIds(ids);

        return ids.map((_, index) => tenants[index]);
    };

    return {
        get getTenant() {
            let tenantLoader = loaders.get("getTenant");
            if (tenantLoader) {
                return tenantLoader;
            }
            tenantLoader = new DataLoader<string, any>(ids => getTenant(ids));
            loaders.set("getTenant", tenantLoader);
            return tenantLoader;
        }
    };
}

export function createTenantsMethods(storageOperations: TenancyStorageOperations) {
    const loaders = createTenantLoaders(storageOperations);

    return {
        onTenantBeforeCreate: createTopic<TenantBeforeCreateEvent>(),
        onTenantAfterCreate: createTopic<TenantAfterCreateEvent>(),
        onTenantBeforeUpdate: createTopic<TenantBeforeUpdateEvent>(),
        onTenantAfterUpdate: createTopic<TenantAfterUpdateEvent>(),
        onTenantBeforeDelete: createTopic<TenantBeforeDeleteEvent>(),
        onTenantAfterDelete: createTopic<TenantAfterDeleteEvent>(),
        async getRootTenant() {
            return loaders.getTenant.load("root");
        },

        async getTenantById<TTenant extends Tenant = Tenant>(
            this: Tenancy,
            id: string
        ): Promise<TTenant> {
            return await loaders.getTenant.load(id);
        },

        async listTenants<TTenant extends Tenant = Tenant>(
            params?: ListTenantsParams
        ): Promise<TTenant[]> {
            return storageOperations.listTenants(params);
        },

        async createTenant<TTenant extends Tenant = Tenant>(
            this: Tenancy,
            data: CreateTenantInput
        ) {
            const tenant: Tenant = {
                ...data,
                id: data.id ?? mdbid(),
                status: data.status || "active",
                settings: {
                    ...(data.settings || {}),
                    domains: (data.settings && data.settings.domains) || []
                    // themes: (data.settings && data.settings.themes) || []
                },
                savedOn: new Date().toISOString(),
                createdOn: new Date().toISOString(),
                parent: data.parent || null,
                webinyVersion: process.env.WEBINY_VERSION
            };

            await this.onTenantBeforeCreate.publish({ tenant });

            await storageOperations.createTenant(tenant);

            await this.onTenantAfterCreate.publish({ tenant });

            // Store data in cache
            loaders.getTenant.clear(tenant.id).prime(tenant.id, tenant);

            return tenant as TTenant;
        },

        async updateTenant<TTenant extends Tenant = Tenant>(
            this: Tenancy,
            id: string,
            data: Partial<TTenant>
        ) {
            const tenant = await this.getTenantById(id);
            const updateData = { ...data, savedOn: new Date().toISOString() };

            await this.onTenantBeforeUpdate.publish({ tenant, inputData: data, updateData });

            Object.assign(tenant, updateData);

            await storageOperations.updateTenant(tenant);

            await this.onTenantAfterUpdate.publish({ tenant, inputData: data });

            // Update data in cache
            loaders.getTenant.clear(id).prime(id, tenant);

            return tenant as TTenant;
        },

        async deleteTenant(this: Tenancy, id: string) {
            const tenant = await this.getTenantById(id);

            await this.onTenantBeforeDelete.publish({ tenant });

            await storageOperations.deleteTenant(id);

            await this.onTenantAfterDelete.publish({ tenant });

            // Remove from cache
            loaders.getTenant.clear(id).prime(id, undefined);

            return true;
        }
    };
}
