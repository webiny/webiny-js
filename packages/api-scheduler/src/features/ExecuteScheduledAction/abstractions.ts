import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import {
    NotAuthorizedError,
    ScheduledActionNotFoundError,
    ScheduledActionPersistenceError
} from "~/domain/errors.js";

/**
 * ExecuteScheduledActionUseCase - Execute a scheduled action
 *
 * This is triggered by EventBridge when a schedule fires.
 * Finds the appropriate handler based on namespace + actionType and executes it.
 *
 * Flow:
 * 1. Load scheduled action from CMS
 * 2. Find registered handler for namespace + actionType
 * 3. Execute handler
 * 4. Delete schedule entry on success
 * 5. Update entry with error on failure
 */

export interface IExecuteScheduledActionErrors {
    notFound: ScheduledActionNotFoundError;
    persistence: ScheduledActionPersistenceError;
    handlerNotFound: HandlerNotFoundError;
    executionFailed: ExecutionFailedError;
    unauthorized: NotAuthorizedError;
}

type ExecuteScheduledActionError =
    IExecuteScheduledActionErrors[keyof IExecuteScheduledActionErrors];

export interface IExecuteScheduledActionUseCaseParams {
    namespace: string;
    tenant: string;
    id: string;
}

export interface IExecuteScheduledActionUseCase {
    execute(
        params: IExecuteScheduledActionUseCaseParams
    ): Promise<Result<void, ExecuteScheduledActionError>>;
}

/** Execute a scheduled action immediately. */
export const ExecuteScheduledActionUseCase = createAbstraction<IExecuteScheduledActionUseCase>(
    "Scheduler/ExecuteScheduledActionUseCase"
);

export namespace ExecuteScheduledActionUseCase {
    export type Interface = IExecuteScheduledActionUseCase;
    export type Error = ExecuteScheduledActionError;
    export type Params = IExecuteScheduledActionUseCaseParams;
}

/**
 * Handler not found error
 */
export class HandlerNotFoundError extends Error {
    readonly code = "Scheduler/Handler/NotFound" as const;

    constructor(namespace: string, actionType: string) {
        super(`No handler registered for namespace "${namespace}" and actionType "${actionType}"`);
        this.name = "HandlerNotFoundError";
    }
}

/**
 * Execution failed error
 */
export class ExecutionFailedError extends Error {
    readonly code = "Scheduler/Execution/Failed" as const;

    constructor(
        message: string,
        public readonly originalError?: Error
    ) {
        super(message);
        this.name = "ExecutionFailedError";
    }
}
