import { createImplementation } from "@webiny/feature/api";
import { KernelExecution } from "@webiny/api-kernel-core";
import { TenantContext as Abstraction } from "./abstractions.js";
import type { Tenant } from "~/types/tenancy.js";
import {
    TenantAlreadySetError,
    TenantScopesUnavailableError,
    assertTenantEnabled
} from "./errors.js";
import { type TenantScope, TenantScopes } from "~/features/tenancy/TenantScopes/abstractions.js";

/**
 * The tenant of a tenant scope's container. Every service of the container is built for that
 * tenant; work in another tenant runs in that tenant's scope (`TenantScopes.withTenant()`).
 */
class TenantContextImpl implements Abstraction.Interface {
    private currentTenant: Tenant | null = null;

    constructor(
        private kernelExecution: KernelExecution.Interface | undefined,
        private tenantScopes: TenantScopes.Interface | undefined
    ) {}

    getTenant(): Tenant {
        this.kernelExecution?.assertCurrent("TenantContext");
        return this.currentTenant!;
    }

    /*
     * Sets the container's tenant, once. Every service of the container was built for that tenant,
     * so switching to another one would leave them acting on the first. Setting the same tenant
     * again refreshes its record: the system install replaces the bootstrap root with the real one.
     */
    setTenant(tenant: Tenant): void {
        this.kernelExecution?.assertCurrent("TenantContext");
        assertTenantEnabled(tenant);

        if (this.currentTenant && this.currentTenant.id !== tenant.id) {
            throw new TenantAlreadySetError(this.currentTenant.id, tenant.id);
        }
        this.currentTenant = tenant;
    }

    /** @deprecated See the abstraction. */
    async withRootTenant<T>(cb: (tenant: Tenant, scope: TenantScope.Interface) => T): Promise<T> {
        // The callback may be synchronous: its value is returned as the promise's.
        return this.getTenantScopes().withRootTenant(async scope => cb(scope.tenant, scope));
    }

    /** @deprecated See the abstraction. */
    async withEachTenant<TReturn>(
        tenants: Tenant[],
        cb: (tenant: Tenant, scope: TenantScope.Interface) => Promise<TReturn>
    ): Promise<TReturn[]> {
        return this.getTenantScopes().withEachTenant(tenants, scope => cb(scope.tenant, scope));
    }

    /** @deprecated See the abstraction. */
    async withTenant<TReturn>(
        tenant: Tenant,
        cb: (tenant: Tenant, scope: TenantScope.Interface) => Promise<TReturn>
    ): Promise<TReturn> {
        return this.getTenantScopes().withTenant(tenant, scope => cb(scope.tenant, scope));
    }

    private getTenantScopes(): TenantScopes.Interface {
        this.kernelExecution?.assertCurrent("TenantContext");
        if (!this.tenantScopes) {
            throw new TenantScopesUnavailableError();
        }
        return this.tenantScopes;
    }
}

/*
 * In a tenant scope, `TenantScopes` comes from the request container. Optional: a bare container
 * (no `registerApiRequestStack()` or `ApiCoreFeature`) has none, and only the `with*` methods need it.
 */
export const TenantContext = createImplementation({
    abstraction: Abstraction,
    implementation: TenantContextImpl,
    dependencies: [
        [KernelExecution, { optional: true }],
        [TenantScopes, { optional: true }]
    ]
});
