import { createAbstraction, Result } from "@webiny/feature/api";
import type { IScheduledAction } from "~/shared/abstractions.js";
import {
    InvalidScheduleDateError,
    ScheduledActionPersistenceError,
    SchedulerServiceError
} from "~/domain/errors.js";
import type { GenericRecord } from "@webiny/api/types.js";

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

interface IRunActionParams<T extends GenericRecord> {
    namespace: string;
    actionType: string;
    targetId: string;
    payload: T;
}

export interface IRunActionUseCase {
    execute<T extends GenericRecord>(params: IRunActionParams<T>): Promise<Result<IScheduledAction<T>, RunActionError>>;
}

export const RunActionUseCase = createAbstraction<IRunActionUseCase>("RunActionUseCase");

export namespace RunActionUseCase {
    export type Interface = IRunActionUseCase;
    export type Params<T extends GenericRecord> = IRunActionParams<T>;
    export type Error = RunActionError;
}
