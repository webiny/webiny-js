import { makeAutoObservable } from "mobx";
import { runInAction } from "mobx";
import { TenantSwitcherSource } from "~/features/tenantSwitcher/abstractions.js";
import { TenantContext } from "~/features/tenancy/abstractions.js";
import { ROOT_TENANT_ID } from "~/features/tenancy/rootTenant.js";
import { TenantSwitcherPresenter as Abstraction } from "./abstractions.js";

const SEARCH_DELAY_MS = 250;

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
    private loading = false;
    private searchTimer: ReturnType<typeof setTimeout> | undefined;
    private initialized: Promise<void> | undefined;
    // Only the latest list request may write its result.
    private request = 0;

    constructor(
        private source: TenantSwitcherSource.Interface,
        private tenantContext: TenantContext.Interface
    ) {
        makeAutoObservable<
            TenantSwitcherPresenterImpl,
            "source" | "tenantContext" | "searchTimer" | "initialized"
        >(this, { source: false, tenantContext: false, searchTimer: false, initialized: false });
    }

    get vm(): Abstraction.ViewModel {
        return {
            current: this.current ? toViewTenant(this.current) : null,
            tenants: this.tenants.map(toViewTenant),
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

        this.tenantContext.setTenant(tenantId);
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
        this.loading = true;

        let tenants: TenantSwitcherSource.Tenant[] = [];
        try {
            tenants = await this.source.listTenants(this.search || undefined);
        } catch {
            // A failed request leaves the menu with no tenants rather than an unhandled rejection.
            tenants = [];
        }

        if (request !== this.request) {
            return;
        }

        runInAction(() => {
            this.tenants = tenants;
            this.loading = false;
        });
    }
}

export const TenantSwitcherPresenter = Abstraction.createImplementation({
    implementation: TenantSwitcherPresenterImpl,
    dependencies: [TenantSwitcherSource, TenantContext]
});
