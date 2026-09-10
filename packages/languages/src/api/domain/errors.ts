import { BaseError } from "@webiny/feature/api";

export class LanguageNotFoundError extends BaseError<{ code: string }> {
    override readonly code = "Languages/NotFound" as const;

    constructor(languageCode: string) {
        super({
            message: `Language not found: "${languageCode}".`,
            data: {
                code: languageCode
            }
        });
    }
}

export class DefaultLanguageNotFoundError extends BaseError {
    override readonly code = "Languages/DefaultNotFound" as const;

    constructor() {
        super({
            message: "No default language is configured."
        });
    }
}

export class LanguagePersistenceError extends BaseError {
    override readonly code = "Languages/PersistenceError" as const;

    constructor(error: Error) {
        super({ message: error.message });
    }
}
