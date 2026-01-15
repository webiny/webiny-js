import { BaseError } from "@webiny/feature/api";

export class UserStorageError extends BaseError {
    override readonly code = "AdminUser/Persistence" as const;

    constructor(error: Error) {
        super({
            message: error.message
        });
    }
}

export class UserNotFoundError extends BaseError<{ id: string }> {
    override readonly code = "AdminUser/NotFound" as const;

    constructor(id: string) {
        super({
            message: `User "${id}" was not found!`,
            data: { id }
        });
    }
}

export class EmailTakenError extends BaseError<{ email: string }> {
    override readonly code = "AdminUser/EmailTaken" as const;

    constructor(email: string) {
        super({
            message: `User with email "${email}" already exists.`,
            data: { email }
        });
    }
}

export class UserValidationError extends BaseError<{ message: string }> {
    override readonly code = "AdminUser/Validation" as const;

    constructor(message: string) {
        super({
            message,
            data: { message }
        });
    }
}

// Authorization error
export class NotAuthorizedError extends BaseError {
    override readonly code = "AdminUser/NotAuthorized" as const;

    constructor(message?: string) {
        super({
            message: message || "Not authorized!"
        });
    }
}
