import { BaseError } from "@webiny/feature/api";
import type { Tenant } from "~/types/tenancy.js";

export class TenantIsDisabledError extends BaseError {
    override readonly code = "Tenancy/TenantDisabled" as const;

    constructor() {
        super({ message: "Tenant is disabled!" });
    }
}

/**
 * A container's tenant was set to another tenant. The container's services were built for the first
 * one: run the work in the other tenant's scope instead (`TenantScopes.withTenant()`).
 */
export class TenantAlreadySetError extends BaseError<{
    tenantId: string;
    requestedTenantId: string;
}> {
    override readonly code = "Tenancy/TenantAlreadySet" as const;

    constructor(tenantId: string, requestedTenantId: string) {
        super({
            message: `The tenant of this container is already "${tenantId}", so it can't be set to "${requestedTenantId}". Run the work in that tenant's scope instead, with TenantScopes.withTenant().`,
            data: { tenantId, requestedTenantId }
        });
    }
}

/** Throws `TenantIsDisabledError` for an installed tenant that is disabled. */
export function assertTenantEnabled(tenant: Tenant): void {
    if (tenant.isInstalled && tenant.status === "disabled") {
        throw new TenantIsDisabledError();
    }
}
