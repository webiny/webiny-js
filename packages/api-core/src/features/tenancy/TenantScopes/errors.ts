import { BaseError } from "@webiny/feature/api";
import { DEFAULT_TENANT_STORAGE } from "./abstractions.js";

/** A tenant scope was asked for on a storage that doesn't exist. */
export class UnknownTenantStorageError extends BaseError<{ storage: string }> {
    override readonly code = "Tenancy/UnknownTenantStorage" as const;

    constructor(storage: string) {
        super({
            message: `Tenant storage "${storage}" doesn't exist. Every tenant runs on the "${DEFAULT_TENANT_STORAGE}" storage.`,
            data: { storage }
        });
    }
}

/** A tenant scope was asked for, but the request has no registration to build one with. */
export class MissingTenantScopeRegistrationError extends BaseError {
    override readonly code = "Tenancy/MissingTenantScopeRegistration" as const;

    constructor() {
        super({
            message:
                "The request container has no TenantScopeRegistration, so no tenant scope can be built. Register the API's request stack with registerApiRequestStack(), which registers it."
        });
    }
}

/**
 * A container that holds the whole API for one tenant (a test harness that builds no tenant scopes)
 * was asked for another tenant's scope.
 */
export class NoTenantScopesError extends BaseError<{
    tenantId: string | undefined;
    requestedTenantId: string;
}> {
    override readonly code = "Tenancy/NoTenantScopes" as const;

    constructor(tenantId: string | undefined, requestedTenantId: string) {
        super({
            message: `This container holds the API for tenant "${tenantId ?? "(none)"}" only and builds no tenant scopes, so it can't run work in tenant "${requestedTenantId}". Build the request with tenant scopes: registerApiRequestStack(), or createTenantScopedChild() in tests.`,
            data: { tenantId, requestedTenantId }
        });
    }
}
