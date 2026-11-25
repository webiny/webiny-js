import { BaseError } from "@webiny/feature/api";

/**
 * A storage operation was given a tenant other than its scope's. Storage acts only on its scope's
 * tenant: run the work in the other tenant's scope instead (`TenantScopes.withTenant()`).
 */
export class TenantScopeMismatchError extends BaseError<{
    scopeTenantId: string;
    passedTenantId: string;
}> {
    override readonly code = "Tenancy/TenantScopeMismatch" as const;

    constructor(scopeTenantId: string, passedTenantId: string) {
        super({
            message: `Storage of tenant "${scopeTenantId}" was given tenant "${passedTenantId}". Run the work in that tenant's scope instead, with TenantScopes.withTenant().`,
            data: { scopeTenantId, passedTenantId }
        });
    }
}

/** Storage was used in a scope whose tenant isn't set yet. */
export class NoScopeTenantError extends BaseError {
    override readonly code = "Tenancy/NoScopeTenant" as const;

    constructor() {
        super({
            message:
                "Storage was used in a scope that has no tenant. Run it in a tenant's scope, with TenantScopes.withTenant()."
        });
    }
}

/** Throws `TenantScopeMismatchError` when a passed tenant is set and differs from the scope's. */
export function assertScopeTenant(
    scopeTenantId: string,
    passed: ReadonlyArray<string | null | undefined>
): void {
    for (const tenantId of passed) {
        if (tenantId && tenantId !== scopeTenantId) {
            throw new TenantScopeMismatchError(scopeTenantId, tenantId);
        }
    }
}
