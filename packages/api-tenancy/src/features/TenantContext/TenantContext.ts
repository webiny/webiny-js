import { createImplementation } from "@webiny/feature/api";
import { TenantContext as Abstraction } from "./abstractions.js";
import type { Tenant } from "~/types.js";
import { GetRootTenantUseCase } from "~/features/GetRootTenant/index.js";

class TenantContextImpl implements Abstraction.Interface {
    private currentTenant: Tenant | null = null;

    constructor(private getRootTenant: GetRootTenantUseCase.Interface) {}

    getTenant(): Tenant {
        return this.currentTenant!;
    }

    setTenant(tenant: Tenant): void {
        this.currentTenant = tenant;
    }

    async withRootTenant<T>(cb: () => T): Promise<T> {
        const initialTenant = this.getTenant();
        const rootTenant = await this.getRootTenant.execute();
        if (!rootTenant.isOk()) {
            return rootTenant.error as T;
        }

        const tenant = rootTenant.value as Tenant;

        this.setTenant(tenant);
        try {
            return await cb();
        } finally {
            // Make sure that, whatever happens in the callback, the tenant is set back to the initial one.
            this.setTenant(initialTenant);
        }
    }

    async withEachTenant<TReturn>(
        tenants: Tenant[],
        cb: (tenant: Tenant) => Promise<TReturn>
    ): Promise<TReturn[]> {
        const initialTenant = this.getTenant();
        const results = [];
        for (const tenant of tenants) {
            this.setTenant(tenant);
            try {
                results.push(await cb(tenant));
            } finally {
                this.setTenant(initialTenant);
            }
        }
        return results;
    }

    async withTenant<TReturn>(
        tenant: Tenant,
        cb: (tenant: Tenant) => Promise<TReturn>
    ): Promise<TReturn> {
        const initialTenant = this.getTenant();
        this.setTenant(tenant);
        const result = await cb(tenant);
        this.setTenant(initialTenant);
        return result;
    }
}

export const TenantContext = createImplementation({
    abstraction: Abstraction,
    implementation: TenantContextImpl,
    dependencies: [GetRootTenantUseCase]
});
