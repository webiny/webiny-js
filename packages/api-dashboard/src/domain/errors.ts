import { BaseError } from "@webiny/feature/api";

export class DashboardNotAuthenticatedError extends BaseError {
    override readonly code = "Dashboard/NotAuthenticated" as const;

    constructor() {
        super({
            message: "Only a signed-in identity has a dashboard."
        });
    }
}

export class DashboardPersistenceError extends BaseError {
    override readonly code = "Dashboard/PersistenceError" as const;

    constructor(error: Error) {
        super({
            message: error.message
        });
    }
}
