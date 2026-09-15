import { BaseError } from "@webiny/feature/api";

export class NotificationNotFoundError extends BaseError<{ id: string }> {
    override readonly code = "Notifications/NotFound" as const;

    constructor(data: { id: string }) {
        super({
            message: `Notification with id "${data.id}" was not found!`,
            data
        });
    }
}

export class NotificationNotAuthorizedError extends BaseError {
    override readonly code = "Notifications/NotAuthorized" as const;

    constructor(message?: string) {
        super({
            message: message || "Not authorized to access this notification."
        });
    }
}

export class NotificationPersistenceError extends BaseError {
    override readonly code = "Notifications/Persistence" as const;

    constructor(error: Error) {
        super({
            message: error.message
        });
    }
}
