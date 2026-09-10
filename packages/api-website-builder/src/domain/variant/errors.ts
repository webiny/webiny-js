import { BaseError } from "@webiny/feature/api";

export class VariantNotFoundError extends BaseError<{ id: string }> {
    override readonly code = "WebsiteBuilder/Variant/NotFound" as const;

    constructor(id: string) {
        super({
            message: "Variant not found!",
            data: {
                id
            }
        });
    }
}

export class VariantPersistenceError extends BaseError {
    override readonly code = "WebsiteBuilder/Variant/PersistenceError" as const;

    constructor(error: Error) {
        super({ message: error.message });
    }
}

export class VariantValidationError extends BaseError {
    override readonly code = "WebsiteBuilder/Variant/ValidationError" as const;

    constructor(message: string) {
        super({ message });
    }
}

export class VariantNotAuthorizedError extends BaseError {
    override readonly code = "WebsiteBuilder/Variant/NotAuthorized" as const;

    constructor() {
        super({ message: "Not authorized!" });
    }
}
