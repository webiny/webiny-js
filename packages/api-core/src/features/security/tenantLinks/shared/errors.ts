import { BaseError } from "@webiny/feature/api";

export class TenantLinkStorageError extends BaseError {
    override readonly code = "TENANT_LINK_STORAGE_ERROR" as const;

    constructor(error: Error) {
        super({
            message: error.message
        });
    }
}

export class TenantLinkNotFoundError extends BaseError {
    override readonly code = "TENANT_LINK_NOT_FOUND" as const;

    constructor() {
        super({
            message: `Tenant link was not found!`
        });
    }
}

type NotAuthorizedErrorData = {
    message?: string;
};

export class NotAuthorizedError extends BaseError<NotAuthorizedErrorData> {
    override readonly code = "NOT_AUTHORIZED" as const;

    constructor(data: NotAuthorizedErrorData = {}) {
        super({
            message: data.message || "Not authorized!",
            data
        });
    }
}

type TenantLinkValidationErrorData = {
    message: string;
};

export class TenantLinkValidationError extends BaseError<TenantLinkValidationErrorData> {
    override readonly code = "TENANT_LINK_VALIDATION_ERROR" as const;

    constructor(message: string) {
        super({
            message,
            data: { message }
        });
    }
}
