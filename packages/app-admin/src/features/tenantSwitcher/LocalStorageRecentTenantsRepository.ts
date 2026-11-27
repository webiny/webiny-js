import { LocalStorage } from "@webiny/app/features/localStorage";
import { ROOT_TENANT_ID } from "~/features/tenancy/rootTenant.js";
import { RecentTenantsRepository as Abstraction } from "./abstractions.js";
import type { TenantSwitcherSource } from "./abstractions.js";

const LOCAL_STORAGE_KEY = "tenantSwitcher.recentTenants";
const MAX_RECENT = 5;

/**
 * Keeps the name and logo with the id, so a recent tenant shows even when it isn't in the first page
 * of the tenant list.
 */
class LocalStorageRecentTenantsRepositoryImpl implements Abstraction.Interface {
    constructor(private localStorage: LocalStorage.Interface) {}

    list(): TenantSwitcherSource.Tenant[] {
        const stored = this.localStorage.get<TenantSwitcherSource.Tenant[]>(LOCAL_STORAGE_KEY);
        if (!Array.isArray(stored)) {
            return [];
        }

        return stored;
    }

    remember(tenant: TenantSwitcherSource.Tenant): void {
        if (tenant.id === ROOT_TENANT_ID) {
            return;
        }

        const others = this.list().filter(recent => recent.id !== tenant.id);
        const recent = [tenant, ...others].slice(0, MAX_RECENT);
        this.localStorage.set(LOCAL_STORAGE_KEY, recent);
    }
}

export const LocalStorageRecentTenantsRepository = Abstraction.createImplementation({
    implementation: LocalStorageRecentTenantsRepositoryImpl,
    dependencies: [LocalStorage]
});
