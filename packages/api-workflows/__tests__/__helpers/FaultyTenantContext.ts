import type { Container } from "@webiny/feature/api";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";

export type TenantFaultMode = "none" | "missing" | "throws";

export interface TenantFault {
    mode: TenantFaultMode;
}

/**
 * How `getTenant` behaves: `none` passes through, `missing` returns `null` (no current tenant),
 * `throws` throws. Set it right before the call under test and reset it to `none` after each
 * test.
 */
export const tenantFault: TenantFault = { mode: "none" };

class FaultyTenantContext implements TenantContext.Interface {
    public constructor(private decoratee: TenantContext.Interface) {}

    public getTenant(): Tenant {
        if (tenantFault.mode === "throws") {
            throw new Error("The tenant could not be read.");
        }
        if (tenantFault.mode === "missing") {
            return null as unknown as Tenant;
        }
        return this.decoratee.getTenant();
    }

    public setTenant(tenant: Tenant): void {
        this.decoratee.setTenant(tenant);
    }

    public withRootTenant<T>(cb: () => T): Promise<T> {
        return this.decoratee.withRootTenant(cb);
    }

    public withEachTenant<TReturn>(
        tenants: Tenant[],
        cb: (tenant: Tenant) => Promise<TReturn>
    ): Promise<TReturn[]> {
        return this.decoratee.withEachTenant(tenants, cb);
    }

    public withTenant<TReturn>(
        tenant: Tenant,
        cb: (tenant: Tenant) => Promise<TReturn>
    ): Promise<TReturn> {
        return this.decoratee.withTenant(tenant, cb);
    }
}

/**
 * Makes the current tenant missing or unreadable for a test. `TenantContext` is a singleton that
 * the test handler has already resolved by the time `setup` runs, so a decorator would never wrap
 * it: the helper resolves the real one and registers the faulty wrapper as the instance.
 */
export const registerFaultyTenantContext = (container: Container): void => {
    const real = container.resolve(TenantContext);
    container.registerInstance(TenantContext, new FaultyTenantContext(real));
};
