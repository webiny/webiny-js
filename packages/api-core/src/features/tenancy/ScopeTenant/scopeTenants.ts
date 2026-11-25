import type { ScopeTenant } from "./abstractions.js";
import { NoScopeTenantError, assertScopeTenant } from "./errors.js";

/**
 * For storage built where there is no tenant: the request container's tenant registry. Using its
 * tenant-specific parts throws `NoScopeTenantError`.
 */
export const tenantNeutralScopeTenant: ScopeTenant.Interface = {
    getId(): string {
        throw new NoScopeTenantError();
    }
};

/** A scope tenant fixed to one tenant id, for storage built outside a tenant scope (tests, tools). */
export const createFixedScopeTenant = (tenantId: string): ScopeTenant.Interface => {
    return {
        getId(...passed: ScopeTenant.Passed[]): string {
            assertScopeTenant(tenantId, passed);
            return tenantId;
        }
    };
};
