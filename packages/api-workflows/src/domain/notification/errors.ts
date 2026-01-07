import { BaseError } from "@webiny/feature/api";

export class NotificationAuthorizedError extends BaseError {
    override readonly code = "Workflows/Notification/NotAuthorized" as const;

    constructor(message?: string) {
        super({
            message: message || "Not authorized to access notifications."
        });
    }
}
