import { BaseError } from "@webiny/feature/api";

export class RedirectNotFoundError extends BaseError {
    override readonly code = "WebsiteBuilder/Redirect/NotFound" as const;

    constructor(id: string) {
        super({
            message: `Redirect with id "${id}" not found!`
        });
    }
}

export class RedirectPersistenceError extends BaseError<{ error: Error }> {
    override readonly code = "WebsiteBuilder/Redirect/PersistenceError" as const;

    constructor(error: Error) {
        super({
            message: `Redirect persistence error: ${error.message}`,
            data: { error }
        });
    }
}

export class RedirectValidationError extends BaseError {
    override readonly code = "WebsiteBuilder/Redirect/ValidationError" as const;

    constructor(message: string) {
        super({
            message: `Redirect validation error: ${message}`
        });
    }
}

export class RedirectNotAuthorizedError extends BaseError {
    override readonly code = "WebsiteBuilder/Redirect/NotAuthorized" as const;

    constructor() {
        super({ message: "Not authorized!" });
    }
}
