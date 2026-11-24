import { BaseError } from "@webiny/feature/api";

export class TenantNotFoundError extends BaseError<{ tenantId: string }> {
    override readonly code = "Tenancy/TenantNotFound" as const;

    constructor(tenantId: string) {
        super({ message: `Tenant "${tenantId}" was not found.`, data: { tenantId } });
    }
}
