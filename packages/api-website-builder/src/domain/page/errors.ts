import { BaseError } from "@webiny/feature/api";

export class PageNotFoundError extends BaseError<{ id: string }> {
    override readonly code = "WebsiteBuilder/Page/NotFound" as const;

    constructor(id: string) {
        super({
            message: "Page not found!",
            data: {
                id
            }
        });
    }
}

export class PagePersistenceError extends BaseError {
    override readonly code = "WebsiteBuilder/Page/PersistenceError" as const;

    constructor(error: Error) {
        super({ message: error.message });
    }
}

export class PageValidationError extends BaseError {
    override readonly code = "WebsiteBuilder/Page/ValidationError" as const;

    constructor(message: string) {
        super({ message });
    }
}

export class PageNotAuthorizedError extends BaseError {
    override readonly code = "WebsiteBuilder/Page/NotAuthorized" as const;

    constructor() {
        super({ message: "Not authorized!" });
    }
}
