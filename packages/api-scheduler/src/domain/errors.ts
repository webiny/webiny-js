import { BaseError } from "@webiny/feature/api";

/**
 * Scheduled action not found error
 */
export class ScheduledActionNotFoundError extends BaseError<{ scheduleId: string }> {
    override readonly code = "Scheduler/ScheduledAction/NotFound" as const;

    constructor(scheduleId: string) {
        super({
            message: `Scheduled action "${scheduleId}" was not found`,
            data: { scheduleId }
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
export class InvalidScheduleDateError extends BaseError<{ scheduleOn: string }> {
    override readonly code = "Scheduler/ScheduledAction/InvalidDate" as const;

    constructor(scheduleOn: string) {
        super({
            message: "Cannot schedule in the past",
            data: { scheduleOn }
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
