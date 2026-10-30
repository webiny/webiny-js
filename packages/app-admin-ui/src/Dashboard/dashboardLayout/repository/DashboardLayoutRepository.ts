import { LocalStorage } from "@webiny/app/exports/admin/local-storage.js";
import { TenantContext } from "@webiny/app-admin/exports/admin/tenancy.js";
import { DashboardLayoutRepository as RepositoryAbstraction } from "./abstractions.js";
import { DashboardLayoutGateway } from "./abstractions.js";
import type { DashboardLayoutData } from "../types.js";

// Bump when the cached shape changes; older entries are then ignored and replaced on the next fetch.
const CACHE_VERSION = 1;

interface CachedLayout {
    version: number;
    layout: DashboardLayoutData;
}

class DashboardLayoutRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private gateway: DashboardLayoutGateway.Interface,
        private localStorage: LocalStorage.Interface,
        private tenantContext: TenantContext.Interface
    ) {}

    getCached(userId: string): DashboardLayoutData | null {
        const key = this.cacheKey(userId);
        const cached = this.localStorage.get<CachedLayout>(key);
        if (!cached || cached.version !== CACHE_VERSION) {
            return null;
        }
        return cached.layout;
    }

    async fetch(userId: string): Promise<DashboardLayoutData | null> {
        const layout = await this.gateway.get();
        this.writeCache(userId, layout);
        return layout;
    }

    async save(userId: string, layout: DashboardLayoutData): Promise<void> {
        // Cache first, so a reload shows the change even while the request is still in flight.
        this.writeCache(userId, layout);
        await this.gateway.save(layout);
    }

    private writeCache(userId: string, layout: DashboardLayoutData | null): void {
        const key = this.cacheKey(userId);
        if (!layout) {
            this.localStorage.remove(key);
            return;
        }
        this.localStorage.set<CachedLayout>(key, { version: CACHE_VERSION, layout });
    }

    private cacheKey(userId: string): string {
        const tenantId = this.tenantContext.getCurrentTenant() ?? "root";
        return `dashboard:${tenantId}:${userId}`;
    }
}

export const DashboardLayoutRepository = RepositoryAbstraction.createImplementation({
    implementation: DashboardLayoutRepositoryImpl,
    dependencies: [DashboardLayoutGateway, LocalStorage, TenantContext]
});
