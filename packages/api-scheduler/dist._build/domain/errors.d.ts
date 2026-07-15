import { BaseError } from "@webiny/feature/api";
/**
 * Not authorized error when user lacks permissions to manage scheduled actions.
 */
export declare class NotAuthorizedError extends BaseError {
    readonly code: "Scheduler/NotAuthorized";
    constructor();
}
/**
 * Scheduled action not found error
 */
export declare class ScheduledActionNotFoundError extends BaseError<{
    scheduleId: string;
}> {
    readonly code: "Scheduler/ScheduledAction/NotFound";
    constructor(scheduleId: string);
}
/**
 * Storage/persistence error when working with scheduled actions
 */
export declare class ScheduledActionPersistenceError extends BaseError<{
    originalError: Error;
}> {
    readonly code: "Scheduler/ScheduledAction/PersistenceError";
    constructor(error: Error);
}
/**
 * Invalid schedule date error (e.g., scheduling in the past)
 */
export declare class InvalidScheduleDateError extends BaseError<{
    scheduleFor: string;
}> {
    readonly code: "Scheduler/ScheduledAction/InvalidDate";
    constructor(scheduleFor: Date);
}
/**
 * Scheduler service error (EventBridge/cloud provider errors)
 */
export declare class SchedulerServiceError extends BaseError<{
    originalError: Error;
}> {
    readonly code: "Scheduler/Service/Error";
    constructor(error: Error);
}
interface INamespaceHandlerNotFoundErrorData {
    namespace: string;
}
/**
 * Namespace handler not found error.
 */
export declare class NamespaceHandlerNotFoundError extends BaseError<INamespaceHandlerNotFoundErrorData> {
    readonly code: "Scheduler/NamespaceHandler/NotFound";
    constructor(namespace: string);
}
export {};
