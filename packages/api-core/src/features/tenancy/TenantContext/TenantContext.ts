import { createImplementation } from "@webiny/feature/api";
import { TenantContext as Abstraction } from "./abstractions.js";
import type { Tenant } from "~/types/tenancy.js";
import { GetRootTenantUseCase } from "~/features/tenancy/GetRootTenant/index.js";
import { TenantIsDisabledError } from "./errors.js";

class TenantContextImpl implements Abstraction.Interface {
    private currentTenant: Tenant | null = null;

    constructor(private getRootTenant: GetRootTenantUseCase.Interface) {}

    getTenant(): Tenant {
        return this.currentTenant!;
    }

    setTenant(tenant: Tenant): void {
        if (tenant.isInstalled && tenant.status === "disabled") {
            throw new TenantIsDisabledError();
        }
        this.currentTenant = tenant;
    }

    /*
     * Puts back the tenant that was current before a `with*` call. That can be none at all: work
     * outside an HTTP request (a background task, a scheduled action) starts without a tenant.
     * Restoring is not switching, so it skips the checks `setTenant` makes.
     */
    private restoreTenant(tenant: Tenant | null): void {
        this.currentTenant = tenant;
    }

    async withRootTenant<T>(cb: () => T): Promise<T> {
        const initialTenant = this.currentTenant;
        const rootTenant = await this.getRootTenant.execute();
        if (!rootTenant.isOk()) {
            return rootTenant.error as T;
        }

        const tenant = rootTenant.value;

        this.setTenant(tenant);
        try {
            return await cb();
        } finally {
            // Make sure that, whatever happens in the callback, the tenant is set back to the initial one.
            this.restoreTenant(initialTenant);
        }
    }

    async withEachTenant<TReturn>(
        tenants: Tenant[],
        cb: (tenant: Tenant) => Promise<TReturn>
    ): Promise<TReturn[]> {
        const initialTenant = this.currentTenant;
        const results = [];
        for (const tenant of tenants) {
            this.setTenant(tenant);
            try {
                results.push(await cb(tenant));
            } finally {
                this.restoreTenant(initialTenant);
            }
        }
        return results;
    }

    async withTenant<TReturn>(
        tenant: Tenant,
        cb: (tenant: Tenant) => Promise<TReturn>
    ): Promise<TReturn> {
        const initialTenant = this.currentTenant;
        this.setTenant(tenant);
        try {
            return await cb(tenant);
        } finally {
            // Make sure that, whatever happens in the callback, the tenant is set back to the initial one.
            this.restoreTenant(initialTenant);
        }
    }
}

export const TenantContext = createImplementation({
    abstraction: Abstraction,
    implementation: TenantContextImpl,
    dependencies: [GetRootTenantUseCase]
});
