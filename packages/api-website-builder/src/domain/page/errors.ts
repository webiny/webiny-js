import { BaseError } from "@webiny/feature/api";

export class PageModelNotFoundError extends BaseError {
    override readonly code = "WebsiteBuilder/Page/ModelNotFound" as const;

    constructor() {
        super({
            message: "Page model not found!"
        });
    }
}

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
        super({
            message: error.message
        });
    }
}
