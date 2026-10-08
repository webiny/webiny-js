import { BaseError } from "@webiny/feature/api";

export class ActivityLogPersistenceError extends BaseError<{ error: Error }> {
    override readonly code = "ActivityLog/Persist" as const;

    constructor(error: Error) {
        super({ message: error.message, data: { error } });
    }
}

export class ActivityLogReadError extends BaseError<{ error: Error }> {
    override readonly code = "ActivityLog/Read" as const;

    constructor(error: Error) {
        super({ message: error.message, data: { error } });
    }
}
