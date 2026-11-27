import { createAbstraction } from "@webiny/feature/api";
import type { Tenant } from "~/types/tenancy.js";
import type { TenantScope } from "~/features/tenancy/TenantScopes/abstractions.js";

export interface ITenantContext {
    /**
     * Sets the container's tenant, once: setting the same tenant again refreshes its record, and
     * another tenant throws `TenantAlreadySetError`. To work in another tenant, run the work in that
     * tenant's scope with `TenantScopes.withTenant()`.
     */
    setTenant(tenant: Tenant): void;
    /** The tenant of this container's scope. */
    getTenant(): Tenant;
    /**
     * Runs `cb` in the root tenant's scope.
     *
     * @deprecated Use `TenantScopes.withRootTenant()`. The callback runs in the root tenant's
     * scope: resolve services from the `scope` it gets (`scope.resolve(...)`). A service injected
     * into the caller acts on the caller's tenant, so using it inside the callback throws
     * `StaleKernelExecutionError`.
     */
    withRootTenant<T>(cb: (tenant: Tenant, scope: TenantScope.Interface) => T): Promise<T>;
    /**
     * Runs `cb` in each tenant's scope, one tenant at a time, and returns the results in order.
     *
     * @deprecated Use `TenantScopes.withEachTenant()`. Each callback runs in its tenant's scope:
     * resolve services from the `scope` it gets (`scope.resolve(...)`). A service injected into the
     * caller acts on the caller's tenant, so using it inside the callback throws
     * `StaleKernelExecutionError`.
     */
    withEachTenant<TReturn>(
        tenants: Tenant[],
        cb: (tenant: Tenant, scope: TenantScope.Interface) => Promise<TReturn>
    ): Promise<TReturn[]>;
    /**
     * Runs `cb` in the tenant's scope.
     *
     * @deprecated Use `TenantScopes.withTenant()`. The callback runs in the tenant's scope: resolve
     * services from the `scope` it gets (`scope.resolve(...)`). A service injected into the caller
     * acts on the caller's tenant, so using it inside the callback throws
     * `StaleKernelExecutionError`.
     */
    withTenant<TReturn>(
        tenant: Tenant,
        cb: (tenant: Tenant, scope: TenantScope.Interface) => Promise<TReturn>
    ): Promise<TReturn>;
}

/**
 * The tenant of the current tenant scope. Its `withTenant()`, `withRootTenant()` and
 * `withEachTenant()` methods are deprecated: use `TenantScopes`.
 */
export const TenantContext = createAbstraction<ITenantContext>("TenantContext");

export namespace TenantContext {
    export type Interface = ITenantContext;
}
