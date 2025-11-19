import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { IScheduledAction, ISchedulerInput } from "~/shared/abstractions.js";
import {
    ScheduledActionPersistenceError,
    InvalidScheduleDateError,
    SchedulerServiceError
} from "~/domain/errors.js";

/**
 * RunActionUseCase - Schedule an action for immediate execution
 *
 * This is a convenience use case that wraps ScheduleAction and automatically
 * calculates the closest possible execution time (current time + small buffer).
 *
 * Use this when you want to execute an action "immediately" without having to manually
 * calculate the schedule date.
 */

export interface IRunActionErrors {
    persistence: ScheduledActionPersistenceError;
    invalidDate: InvalidScheduleDateError;
    schedulerService: SchedulerServiceError;
}

type RunActionError = IRunActionErrors[keyof IRunActionErrors];

interface IRunActionParams {
    namespace: string;
    actionType: string;
    targetId: string;
    payload?: any;
}

export interface IRunActionUseCase {
    execute(params: IRunActionParams): Promise<Result<IScheduledAction, RunActionError>>;
}

export const RunActionUseCase = createAbstraction<IRunActionUseCase>("RunActionUseCase");

export namespace RunActionUseCase {
    export type Interface = IRunActionUseCase;
    export type Params = IRunActionParams;
    export type Error = RunActionError;
}
