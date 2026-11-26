import { makeAutoObservable, runInAction } from "mobx";
import { TenantSwitcherSource } from "~/features/tenantSwitcher/abstractions.js";
import { TenantContext } from "~/features/tenancy/abstractions.js";
import { TenantSwitcherPresenter as Abstraction } from "./abstractions.js";

const SEARCH_DELAY_MS = 250;

class TenantSwitcherPresenterImpl implements Abstraction.Interface {
    private current: Abstraction.Tenant | null = null;
    private tenants: Abstraction.Tenant[] = [];
    private search = "";
    private loading = false;
    private searchTimer: ReturnType<typeof setTimeout> | undefined;
    // Only the latest list request may write its result.
    private request = 0;

    constructor(
        private source: TenantSwitcherSource.Interface,
        private tenantContext: TenantContext.Interface
    ) {
        makeAutoObservable<TenantSwitcherPresenterImpl, "source" | "tenantContext" | "searchTimer">(
            this,
            { source: false, tenantContext: false, searchTimer: false }
        );
    }

    get vm(): Abstraction.ViewModel {
        return {
            current: this.current,
            tenants: this.tenants,
            canSwitch: this.source.canSwitch(),
            canSearch: this.source.canSearch(),
            search: this.search,
            loading: this.loading
        };
    }

    async init(): Promise<void> {
        const current = await this.source.getCurrentTenant();
        runInAction(() => {
            this.current = current;
        });

        if (this.source.canSwitch()) {
            await this.loadTenants();
        }
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

    private async loadTenants(): Promise<void> {
        const request = ++this.request;
        this.loading = true;

        try {
            const tenants = await this.source.listTenants(this.search || undefined);
            if (request === this.request) {
                runInAction(() => {
                    this.tenants = tenants;
                });
            }
        } finally {
            if (request === this.request) {
                runInAction(() => {
                    this.loading = false;
                });
            }
        }
    }
}

export const TenantSwitcherPresenter = Abstraction.createImplementation({
    implementation: TenantSwitcherPresenterImpl,
    dependencies: [TenantSwitcherSource, TenantContext]
});
