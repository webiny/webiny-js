import { Tenant, TenancyStorageOperations, Tenancy } from "./types";
import { createSystemMethods } from "~/createTenancy/createSystemMethods";
import { createTenantsMethods } from "~/createTenancy/createTenantsMethods";

export interface TenancyConfig {
    tenant: string | null;
    storageOperations: TenancyStorageOperations;
    multiTenancy?: boolean;
}

const withToString = (tenant: Tenant) => {
    return {
        ...tenant,
        toString() {
            return this.id;
        }
    };
};

export async function createTenancy({
    tenant,
    storageOperations,
    multiTenancy = false
}: TenancyConfig): Promise<Tenancy> {
    let currentTenant: Tenant | null = null;

    const tenancy: Tenancy = {
        getStorageOperations() {
            return storageOperations;
        },
        getCurrentTenant<TTenant extends Tenant = Tenant>(): TTenant {
            return currentTenant as TTenant;
        },
        isMultiTenant() {
            return multiTenancy;
        },
        setCurrentTenant(tenant: Tenant) {
            currentTenant = withToString(tenant);
        },
        ...createSystemMethods(storageOperations),
        ...createTenantsMethods(storageOperations)
    };

    if (tenant) {
        currentTenant = await tenancy.getTenantById(tenant);
    }

    return tenancy;
}
