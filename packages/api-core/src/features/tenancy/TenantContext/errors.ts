import { BaseError } from "@webiny/feature/api";

export class TenantIsDisabledError extends BaseError {
    override readonly code = "Tenancy/TenantDisabled" as const;

    constructor() {
        super({ message: "Tenant is disabled!" });
    }
}
