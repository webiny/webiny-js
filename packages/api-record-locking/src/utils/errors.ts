import { BaseError } from "@webiny/feature/api";

export class NotAuthorizedError extends BaseError {
    override readonly code = "NOT_AUTHORIZED" as const;

    constructor(message?: string) {
        super({
            message: message || "Not authorized to perform this action"
        });
    }
}

export class LockUpdateError extends BaseError {
    override readonly code = "LOCK_UPDATE_ERROR" as const;

    constructor(message: string) {
        super({ message });
    }
}
