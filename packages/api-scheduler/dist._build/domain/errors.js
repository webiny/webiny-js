import { BaseError } from "@webiny/feature/api";
class NotAuthorizedError extends BaseError {
    constructor(){
        super({
            message: "Not authorized!"
        }), this.code = "Scheduler/NotAuthorized";
    }
}
class ScheduledActionNotFoundError extends BaseError {
    constructor(scheduleId){
        super({
            message: `Scheduled action "${scheduleId}" was not found.`,
            data: {
                scheduleId
            }
        }), this.code = "Scheduler/ScheduledAction/NotFound";
    }
}
class ScheduledActionPersistenceError extends BaseError {
    constructor(error){
        super({
            message: error.message,
            data: {
                originalError: error
            }
        }), this.code = "Scheduler/ScheduledAction/PersistenceError";
    }
}
class InvalidScheduleDateError extends BaseError {
    constructor(scheduleFor){
        super({
            message: "Cannot schedule in the past",
            data: {
                scheduleFor: scheduleFor.toISOString()
            }
        }), this.code = "Scheduler/ScheduledAction/InvalidDate";
    }
}
class SchedulerServiceError extends BaseError {
    constructor(error){
        super({
            message: `Scheduler service error: ${error.message}`,
            data: {
                originalError: error
            }
        }), this.code = "Scheduler/Service/Error";
    }
}
class NamespaceHandlerNotFoundError extends BaseError {
    constructor(namespace){
        super({
            message: `Namespace handler for "${namespace}" was not found.`,
            data: {
                namespace
            }
        }), this.code = "Scheduler/NamespaceHandler/NotFound";
    }
}
export { InvalidScheduleDateError, NamespaceHandlerNotFoundError, NotAuthorizedError, ScheduledActionNotFoundError, ScheduledActionPersistenceError, SchedulerServiceError };

//# sourceMappingURL=errors.js.map