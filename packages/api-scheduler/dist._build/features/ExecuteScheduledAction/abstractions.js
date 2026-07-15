import { createAbstraction } from "@webiny/feature/api";
const ExecuteScheduledActionUseCase = createAbstraction("Scheduler/ExecuteScheduledActionUseCase");
class HandlerNotFoundError extends Error {
    constructor(namespace, actionType){
        super(`No handler registered for namespace "${namespace}" and actionType "${actionType}"`), this.code = "Scheduler/Handler/NotFound";
        this.name = "HandlerNotFoundError";
    }
}
class ExecutionFailedError extends Error {
    constructor(message, originalError){
        super(message), this.originalError = originalError, this.code = "Scheduler/Execution/Failed";
        this.name = "ExecutionFailedError";
    }
}
export { ExecuteScheduledActionUseCase, ExecutionFailedError, HandlerNotFoundError };

//# sourceMappingURL=abstractions.js.map