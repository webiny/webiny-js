import { BaseError } from "@webiny/feature/api";

export class SimpleEntryPersistenceError extends BaseError {
    override readonly code = "Cms/SimpleEntry/PersistenceError" as const;

    constructor(error: Error) {
        super({
            message: error.message
        });
    }
}
