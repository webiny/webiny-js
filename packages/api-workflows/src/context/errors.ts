import { BaseError } from "@webiny/feature/api";

export class NotAuthorizedError extends BaseError {
    override readonly code = "WORKFLOWS_ACCESS_DENIED" as const;

    constructor(message?: string) {
        super({
            message: message || "Not authorized!"
        });
    }
}
