import { BaseError } from "@webiny/feature/api";

// What `InlineTaskService` returns where the real service would return a failure.
export class InlineTaskError extends BaseError {
    override readonly code = "Testing/InlineTask/Error" as const;

    constructor(message: string) {
        super({ message });
    }
}
