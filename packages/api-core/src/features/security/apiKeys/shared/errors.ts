import { BaseError } from "@webiny/feature/api";

export class ApiKeyPersistenceError extends BaseError {
    override readonly code = "ApiKey/Persistence" as const;

    constructor(error: Error) {
        super({
            message: error.message
        });
    }
}

export class ApiKeyNotFoundError extends BaseError {
    override readonly code = "ApiKey/NotFound" as const;

    constructor() {
        super({
            message: `API key was not found!`
        });
    }
}

type NotAuthorizedErrorData = {
    message?: string;
};

export class ApiKeyNotAuthorizedError extends BaseError<NotAuthorizedErrorData> {
    override readonly code = "ApiKey/NotAuthorized" as const;

    constructor(data: NotAuthorizedErrorData = {}) {
        super({
            message: data.message || "Not authorized!",
            data
        });
    }
}

type ApiKeyValidationErrorData = {
    message: string;
};

export class ApiKeyValidationError extends BaseError<ApiKeyValidationErrorData> {
    override readonly code = "ApiKey/Validation" as const;

    constructor(message: string) {
        super({
            message,
            data: { message }
        });
    }
}
