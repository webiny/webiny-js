import { BaseError } from "@webiny/feature/api";

/**
 * Not authorized error when user lacks permissions to manage scheduled actions.
 */
export class NotAuthorizedError extends BaseError {
    override readonly code = "Scheduler/NotAuthorized" as const;

    constructor() {
        super({ message: "Not authorized!" });
    }
}

/**
 * Scheduled action not found error
 */
export class ScheduledActionNotFoundError extends BaseError<{ scheduleId: string }> {
    override readonly code = "Scheduler/ScheduledAction/NotFound" as const;

    constructor(scheduleId: string) {
        super({
            message: `Scheduled action "${scheduleId}" was not found.`,
            data: {
                scheduleId
            }
        });
    }
}

/**
 * Storage/persistence error when working with scheduled actions
 */
export class ScheduledActionPersistenceError extends BaseError<{ originalError: Error }> {
    override readonly code = "Scheduler/ScheduledAction/PersistenceError" as const;

    constructor(error: Error) {
        super({
            message: error.message,
            data: { originalError: error }
        });
    }
}

/**
 * Invalid schedule date error (e.g., scheduling in the past)
 */
export class InvalidScheduleDateError extends BaseError<{ scheduleFor: string }> {
    override readonly code = "Scheduler/ScheduledAction/InvalidDate" as const;

    constructor(scheduleFor: string) {
        super({
            message: "Cannot schedule in the past",
            data: { scheduleFor }
        });
    }
}

/**
 * Scheduler service error (EventBridge/cloud provider errors)
 */
export class SchedulerServiceError extends BaseError<{ originalError: Error }> {
    override readonly code = "Scheduler/Service/Error" as const;

    constructor(error: Error) {
        super({
            message: `Scheduler service error: ${error.message}`,
            data: { originalError: error }
        });
    }
}

interface INamespaceHandlerNotFoundErrorData {
    namespace: string;
}
/**
 * Namespace handler not found error.
 */
export class NamespaceHandlerNotFoundError extends BaseError<INamespaceHandlerNotFoundErrorData> {
    override readonly code = "Scheduler/NamespaceHandler/NotFound" as const;

    constructor(namespace: string) {
        super({
            message: `Namespace handler for "${namespace}" was not found.`,
            data: {
                namespace
            }
        });
    }
}
