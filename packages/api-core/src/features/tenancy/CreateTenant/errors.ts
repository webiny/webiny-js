import { BaseError } from "@webiny/feature/api";

export class CreateTenantError extends BaseError {
    override readonly code = "CREATE_TENANT" as const;

    constructor(data: any) {
        super({
            message: `Failed to create tenant`,
            data
        });
    }
}

export class TenantAlreadyExistsError extends BaseError<{ id: string }> {
    override readonly code = "TENANT_ALREADY_EXISTS" as const;

    constructor(id: string) {
        super({
            message: `Tenant "${id}" already exists.`,
            data: { id }
        });
    }
}
