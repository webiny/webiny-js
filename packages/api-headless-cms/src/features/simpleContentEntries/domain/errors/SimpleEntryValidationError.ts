import { BaseError } from "@webiny/feature/api";

export class SimpleEntryValidationError extends BaseError<unknown[]> {
    override readonly code = "Cms/SimpleEntry/ValidationError" as const;

    constructor(message: string, data?: unknown[]) {
        super({
            message,
            data: data ?? []
        });
    }
}
