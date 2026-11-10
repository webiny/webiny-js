import { AsyncLocalStorage } from "node:async_hooks";
import { createImplementation } from "@webiny/feature/api";
import { TenantContext as Abstraction } from "./abstractions.js";
import type { Tenant } from "~/types/tenancy.js";
import { GetRootTenantUseCase } from "~/features/tenancy/GetRootTenant/index.js";
import { TenantIsDisabledError } from "./errors.js";

function assertTenantEnabled(tenant: Tenant): void {
    if (tenant.isInstalled && tenant.status === "disabled") {
        throw new TenantIsDisabledError();
    }
}

class TenantContextImpl implements Abstraction.Interface {
    private currentTenant: Tenant | null = null;
    /*
     * The `with*` methods switch the tenant for their callback's async call chain only. Before, they
     * set `currentTenant` and restored it afterwards, so any other code of the same request running
     * meanwhile (a sibling GraphQL field, a `Promise.all` branch) read the switched tenant too.
     */
    private readonly overrides = new AsyncLocalStorage<Tenant>();

    constructor(private getRootTenant: GetRootTenantUseCase.Interface) {}

    getTenant(): Tenant {
        const override = this.overrides.getStore();
        if (override) {
            return override;
        }
        return this.currentTenant!;
    }

    /*
     * Sets the request's tenant. Inside a `with*` callback it throws: the switch would either be
     * shared with every async branch of that callback or leak past it, so nest another `with*` call.
     */
    setTenant(tenant: Tenant): void {
        assertTenantEnabled(tenant);

        const override = this.overrides.getStore();
        if (override) {
            throw new Error(
                "TenantContext.setTenant() was called inside a withTenant(), withRootTenant() or withEachTenant() callback. Call withTenant() instead, so the switch stays inside its own callback."
            );
        }
        this.currentTenant = tenant;
    }

    async withRootTenant<T>(cb: () => T): Promise<T> {
        const rootTenant = await this.getRootTenant.execute();
        if (!rootTenant.isOk()) {
            return rootTenant.error as T;
        }

        return this.runAs(rootTenant.value, async () => cb());
    }

    async withEachTenant<TReturn>(
        tenants: Tenant[],
        cb: (tenant: Tenant) => Promise<TReturn>
    ): Promise<TReturn[]> {
        const results = [];
        for (const tenant of tenants) {
            const result = await this.runAs(tenant, () => cb(tenant));
            results.push(result);
        }
        return results;
    }

    async withTenant<TReturn>(
        tenant: Tenant,
        cb: (tenant: Tenant) => Promise<TReturn>
    ): Promise<TReturn> {
        return this.runAs(tenant, () => cb(tenant));
    }

    private runAs<TReturn>(tenant: Tenant, cb: () => Promise<TReturn>): Promise<TReturn> {
        assertTenantEnabled(tenant);

        return this.overrides.run(tenant, cb);
    }
}

export const TenantContext = createImplementation({
    abstraction: Abstraction,
    implementation: TenantContextImpl,
    dependencies: [GetRootTenantUseCase]
});
