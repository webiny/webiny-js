import { BaseError } from "@webiny/feature/api";

export class LogInNotAuthenticatedError extends BaseError {
    override readonly code = "Security/Identity/NotAuthenticated" as const;

    constructor() {
        super({
            message: "Unauthenticated!"
        });
    }
}

export class LogInMissingProfileError extends BaseError {
    override readonly code = "Security/Identity/NotAuthorized" as const;

    constructor() {
        super({
            message: "Missing user profile!"
        });
    }
}
