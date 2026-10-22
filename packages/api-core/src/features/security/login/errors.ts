import { BaseError } from "@webiny/feature/api";
import type { IdentityTenant } from "~/features/security/ResolveIdentityTenants/abstractions.js";

export class LogInNotAuthenticatedError extends BaseError {
    override readonly code = "Security/Identity/NotAuthenticated" as const;

    constructor() {
        super({
            message: "Unauthenticated!"
        });
    }
}

export class LogInMissingProfileError extends BaseError {
    override readonly code = "Security/Identity/NotAuthorized" as const;

    constructor() {
        super({
            message: "Missing user profile!"
        });
    }
}

export class LogInTenantSelectionRequiredError extends BaseError<{ tenants: IdentityTenant[] }> {
    override readonly code = "Security/Identity/TenantSelectionRequired" as const;

    constructor(tenants: IdentityTenant[]) {
        super({
            message: "Your user account belongs to a different tenant.",
            data: { tenants }
        });
    }
}
