import { BaseError } from "@webiny/feature/api";

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
