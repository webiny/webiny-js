import { BaseError } from "@webiny/feature/api";

export class SimpleEntryNotFoundError extends BaseError {
    override readonly code = "Cms/SimpleEntry/NotFound" as const;

    constructor(id?: string) {
        super({
            message: id ? `Simple entry "${id}" was not found!` : `Simple entry was not found!`
        });
    }
}
