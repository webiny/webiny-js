import { makeAutoObservable } from "mobx";
import { runInAction } from "mobx";
import { TenantSwitcherSource } from "~/features/tenantSwitcher/abstractions.js";
import { RecentTenantsRepository } from "~/features/tenantSwitcher/abstractions.js";
import { TenantContext } from "~/features/tenancy/abstractions.js";
import { ROOT_TENANT_ID } from "~/features/tenancy/rootTenant.js";
import { TenantSwitcherPresenter as Abstraction } from "./abstractions.js";

const SEARCH_DELAY_MS = 250;
// Tenants shown besides Root while nothing is searched, for users who can search every tenant.
const SHORT_LIST_SIZE = 5;

const toInitials = (name: string): string => {
    const words = name.split(/\s+/).filter(Boolean);
    const firstTwo = words.slice(0, 2);
    return firstTwo.map(word => word[0].toUpperCase()).join("");
};

const toViewTenant = (tenant: TenantSwitcherSource.Tenant): Abstraction.Tenant => {
    return {
        id: tenant.id,
        name: tenant.name,
        logo: tenant.logo,
        initials: toInitials(tenant.name),
        isRoot: tenant.id === ROOT_TENANT_ID
    };
};

class TenantSwitcherPresenterImpl implements Abstraction.Interface {
    private current: TenantSwitcherSource.Tenant | null = null;
    private tenants: TenantSwitcherSource.Tenant[] = [];
    private search = "";
    // The search `tenants` was loaded for. It lags `search` while a search is on its way.
    private listedSearch = "";
    private loading = false;
    private searchTimer: ReturnType<typeof setTimeout> | undefined;
    private initialized: Promise<void> | undefined;
    // Only the latest list request may write its result.
    private request = 0;

    constructor(
        private source: TenantSwitcherSource.Interface,
        private tenantContext: TenantContext.Interface,
        private recentTenants: RecentTenantsRepository.Interface
    ) {
        makeAutoObservable<
            TenantSwitcherPresenterImpl,
            "source" | "tenantContext" | "recentTenants" | "searchTimer" | "initialized"
        >(this, {
            source: false,
            tenantContext: false,
            recentTenants: false,
            searchTimer: false,
            initialized: false
        });
    }

    get vm(): Abstraction.ViewModel {
        return {
            current: this.current ? toViewTenant(this.current) : null,
            tenants: this.shownTenants().map(toViewTenant),
            canSwitch: this.source.canSwitch(),
            canSearch: this.source.canSearch(),
            search: this.search,
            loading: this.loading
        };
    }

    init(): Promise<void> {
        if (!this.initialized) {
            this.initialized = this.load();
        }

        return this.initialized;
    }

    setSearch(search: string): void {
        this.search = search;

        clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => {
            void this.loadTenants();
        }, SEARCH_DELAY_MS);
    }

    switchTo(tenantId: string): void {
        if (tenantId === this.current?.id) {
            return;
        }

        const tenant = this.shownTenants().find(shown => shown.id === tenantId);
        if (tenant) {
            this.recentTenants.remember(tenant);
        }

        this.tenantContext.setTenant(tenantId);
    }

    /**
     * Users who can search every tenant (root admins) get a short list while nothing is searched:
     * Root, the current tenant, the ones they switched to last, then the rest by name. Everyone else
     * gets their whole list, which is their own few tenants.
     */
    private shownTenants(): TenantSwitcherSource.Tenant[] {
        // An empty list is a failed request too: then nothing, not even the recent tenants.
        if (!this.source.canSearch() || this.listedSearch.trim() || !this.tenants.length) {
            return this.tenants;
        }

        const listed = new Map(this.tenants.map(tenant => [tenant.id, tenant]));
        const shown = new Map<string, TenantSwitcherSource.Tenant>();
        const isFull = () => shown.size - (shown.has(ROOT_TENANT_ID) ? 1 : 0) >= SHORT_LIST_SIZE;
        const show = (tenant: TenantSwitcherSource.Tenant) => {
            if (!shown.has(tenant.id) && (tenant.id === ROOT_TENANT_ID || !isFull())) {
                // The listed copy has the current name and logo; a recent one may be older.
                shown.set(tenant.id, listed.get(tenant.id) ?? tenant);
            }
        };

        const root = listed.get(ROOT_TENANT_ID);
        if (root) {
            show(root);
        }
        if (this.current) {
            show(this.current);
        }
        for (const recent of this.recentTenants.list()) {
            show(recent);
        }
        for (const tenant of this.tenants) {
            show(tenant);
        }

        return [...shown.values()];
    }

    private async load(): Promise<void> {
        const current = await this.source.getCurrentTenant();
        runInAction(() => {
            this.current = current;
        });

        if (this.source.canSwitch()) {
            await this.loadTenants();
        }
    }

    private async loadTenants(): Promise<void> {
        const request = ++this.request;
        const search = this.search;
        this.loading = true;

        let tenants: TenantSwitcherSource.Tenant[] = [];
        try {
            tenants = await this.source.listTenants(search || undefined);
        } catch {
            // A failed request leaves the menu with no tenants rather than an unhandled rejection.
            tenants = [];
        }

        if (request !== this.request) {
            return;
        }

        runInAction(() => {
            this.tenants = tenants;
            this.listedSearch = search;
            this.loading = false;
        });
    }
}

export const TenantSwitcherPresenter = Abstraction.createImplementation({
    implementation: TenantSwitcherPresenterImpl,
    dependencies: [TenantSwitcherSource, TenantContext, RecentTenantsRepository]
});
