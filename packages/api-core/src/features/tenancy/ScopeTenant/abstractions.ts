import { createAbstraction } from "@webiny/feature/api";

export interface IScopeTenant {
    /**
     * The id of the tenant this scope's storage reads and writes. Storage ignores any tenant a
     * caller passes it (a `tenant` parameter, `model.tenant`, …): data always lands under this one.
     *
     * Reads the scope's `TenantContext`, so storage used outside its scope throws
     * `StaleKernelExecutionError`.
     */
    getId(): string;
}

/** The tenant this scope's storage reads and writes. */
export const ScopeTenant = createAbstraction<IScopeTenant>("Tenancy/ScopeTenant");

export namespace ScopeTenant {
    export type Interface = IScopeTenant;
}
