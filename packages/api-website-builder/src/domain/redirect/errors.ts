import { BaseError } from "@webiny/feature/api";

export class RedirectModelNotFoundError extends BaseError {
    override readonly code = "WebsiteBuilder/Redirect/ModelNotFound" as const;

    constructor() {
        super({
            message: "Redirect model not found!"
        });
    }
}

export class RedirectNotFoundError extends BaseError {
    override readonly code = "WebsiteBuilder/Redirect/NotFound" as const;

    constructor(id: string) {
        super({
            message: `Redirect with id "${id}" not found!`
        });
    }
}

export class RedirectPersistenceError extends BaseError {
    override readonly code = "WebsiteBuilder/Redirect/PersistenceError" as const;

    constructor(error: Error) {
        super({
            message: `Redirect persistence error: ${error.message}`,
            cause: error
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
