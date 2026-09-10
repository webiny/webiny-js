import { BaseError } from "@webiny/feature/api";

export class SimpleEntryInvariantError extends BaseError<{ field: string; value: unknown }> {
    override readonly code = "Cms/SimpleEntry/InvariantViolated" as const;

    constructor(field: string, value: unknown, expected: unknown) {
        super({
            message: `A simple entry cannot have "${field}" set to ${JSON.stringify(value)}; it is always ${JSON.stringify(expected)}.`,
            data: { field, value }
        });
    }
}
