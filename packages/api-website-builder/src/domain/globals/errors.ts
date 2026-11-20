import { BaseError } from "@webiny/feature/api";

export class GlobalComponentNotFoundError extends BaseError<{
    name: string;
    language: string;
}> {
    override readonly code = "WebsiteBuilder/GlobalComponent/NotFound" as const;

    constructor(name: string, language: string) {
        super({
            message: `Global component "${name}" in language "${language}" was not found!`,
            data: { name, language }
        });
    }
}

export class GlobalComponentPersistenceError extends BaseError<{ error: Error }> {
    override readonly code = "WebsiteBuilder/GlobalComponent/PersistenceError" as const;

    constructor(error: Error) {
        super({
            message: `Global component persistence error: ${error.message}`,
            data: { error }
        });
    }
}

export class GlobalComponentValidationError extends BaseError {
    override readonly code = "WebsiteBuilder/GlobalComponent/ValidationError" as const;

    constructor(message: string) {
        super({
            message: `Global component validation error: ${message}`
        });
    }
}
