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
