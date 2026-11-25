import { createAbstraction } from "@webiny/feature/api";
import type { Tenant } from "~/types/tenancy.js";

export interface ITenantContext {
    /**
     * Sets the container's tenant, once: setting the same tenant again refreshes its record, and
     * another tenant throws `TenantAlreadySetError`. To work in another tenant, run the work in that
     * tenant's scope with `TenantScopes.withTenant()`.
     */
    setTenant(tenant: Tenant): void;
    /** The tenant of this container's scope. */
    getTenant(): Tenant;
}

/** The tenant of the current tenant scope. */
export const TenantContext = createAbstraction<ITenantContext>("TenantContext");

export namespace TenantContext {
    export type Interface = ITenantContext;
}
