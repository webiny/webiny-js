import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { IScheduledAction, ISchedulerInput } from "~/shared/abstractions.js";
import {
    ScheduledActionPersistenceError,
    InvalidScheduleDateError,
    SchedulerServiceError
} from "~/domain/errors.js";

/**
 * ScheduleActionUseCase - Schedule an action for future execution
 *
 * Handles both new schedules and rescheduling (update) automatically:
 * - If no schedule exists for the namespace+actionType+targetId combination: creates new schedule
 * - If schedule already exists: updates the existing schedule (reschedule)
 */

export interface IScheduleActionErrors {
    persistence: ScheduledActionPersistenceError;
    invalidDate: InvalidScheduleDateError;
    schedulerService: SchedulerServiceError;
}

type ScheduleActionError = IScheduleActionErrors[keyof IScheduleActionErrors];

export interface IScheduleActionUseCase {
    execute(
        namespace: string,
        actionType: string,
        targetId: string,
        input: ISchedulerInput,
        payload?: any
    ): Promise<Result<IScheduledAction, ScheduleActionError>>;
}

export const ScheduleActionUseCase = createAbstraction<IScheduleActionUseCase>(
    "ScheduleActionUseCase"
);

export namespace ScheduleActionUseCase {
    export type Interface = IScheduleActionUseCase;
    export type Error = ScheduleActionError;
}
