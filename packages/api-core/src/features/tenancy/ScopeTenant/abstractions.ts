import { createAbstraction } from "@webiny/feature/api";

/** A tenant a caller passed to a storage operation: a `tenant` parameter, `model.tenant`, … */
export type PassedTenant = string | null | undefined;

export interface IScopeTenant {
    /**
     * The id of the tenant scope's tenant: the tenant storage operations read and write with. Pass
     * every tenant the caller gave the operation (a `tenant` parameter, `model.tenant`,
     * `where.tenant`, …). One that is set and differs from the scope's tenant throws
     * `TenantScopeMismatchError`: storage never acts on a tenant other than its scope's.
     *
     * Reads the scope's `TenantContext`, so storage used outside its scope throws
     * `StaleKernelExecutionError`.
     */
    getId(...passed: PassedTenant[]): string;
}

/**
 * The tenant of the scope a storage operation was built in. Storage takes its tenant from here, not
 * from the operation's parameters, which stay only until they're removed.
 */
export const ScopeTenant = createAbstraction<IScopeTenant>("Tenancy/ScopeTenant");

export namespace ScopeTenant {
    export type Interface = IScopeTenant;
    export type Passed = PassedTenant;
}
