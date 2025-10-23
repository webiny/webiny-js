import { BaseError } from "@webiny/feature/api";

export class ApiKeyStorageError extends BaseError {
    override readonly code = "API_KEY_STORAGE_ERROR" as const;

    constructor(error: Error) {
        super({
            message: error.message,
            data: {}
        });
    }
}

export class ApiKeyNotFoundError extends BaseError {
    override readonly code = "API_KEY_NOT_FOUND" as const;

    constructor() {
        super({
            message: `API key was not found!`,
            data: {}
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
            message: data.message || "Not authorized to perform this action",
            data
        });
    }
}

type ApiKeyValidationErrorData = {
    message: string;
};

export class ApiKeyValidationError extends BaseError<ApiKeyValidationErrorData> {
    override readonly code = "API_KEY_VALIDATION_ERROR" as const;

    constructor(message: string) {
        super({
            message,
            data: { message }
        });
    }
}
