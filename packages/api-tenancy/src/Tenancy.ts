import { Tenant, TenancyStorageOperations, Tenancy } from "./types";
import { createSystemMethods } from "~/Tenancy/createSystemMethods";
import { createTenantsMethods } from "~/Tenancy/createTenantsMethods";

export interface TenancyConfig {
    tenant: string;
    storageOperations: TenancyStorageOperations;
}

export async function createTenancy({
    tenant,
    storageOperations
}: TenancyConfig): Promise<Tenancy> {
    let currentTenant;

    const tenancy: Tenancy = {
        getStorageOperations() {
            return storageOperations;
        },
        getCurrentTenant<TTenant extends Tenant = Tenant>(): TTenant {
            return currentTenant as TTenant;
        },

        setCurrentTenant(tenant: Tenant) {
            currentTenant = tenant;
        },
        ...createSystemMethods(storageOperations),
        ...createTenantsMethods(storageOperations)
    };

    if (tenant) {
        currentTenant = await tenancy.getTenantById(tenant);
    }

    return tenancy;
}
