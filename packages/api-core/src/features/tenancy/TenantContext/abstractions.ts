import { createAbstraction } from "@webiny/feature/api";
import type { Tenant } from "~/types/tenancy.js";

export interface ITenantContext {
    /**
     * Sets the request's tenant. Throws when called inside a `withTenant()`, `withRootTenant()` or
     * `withEachTenant()` callback: nest another `withTenant()` call instead.
     */
    setTenant(tenant: Tenant): void;
    /** The tenant switched to by the enclosing `with*` callback, or the request's tenant. */
    getTenant(): Tenant;
    /*
     * The `with*` methods switch the tenant for their callback's async call chain only. Code of the
     * same request running at the same time keeps reading the request's tenant.
     */
    withRootTenant<T>(cb: () => T): Promise<T>;
    withEachTenant<TReturn>(
        tenants: Tenant[],
        cb: (tenant: Tenant) => Promise<TReturn>
    ): Promise<TReturn[]>;
    withTenant<TReturn>(tenant: Tenant, cb: (tenant: Tenant) => Promise<TReturn>): Promise<TReturn>;
}

/** Provides access to the current tenant and tenant-scoped execution. */
export const TenantContext = createAbstraction<ITenantContext>("TenantContext");

export namespace TenantContext {
    export type Interface = ITenantContext;
}
