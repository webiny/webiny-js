import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { IScheduledAction } from "~/shared/abstractions.js";
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

interface IScheduleActionParams {
    namespace: string;
    actionType: string;
    targetId: string;
    scheduleFor: string;
    title: string;
    payload?: any;
}

export interface IScheduleActionUseCase {
    execute(params: IScheduleActionParams): Promise<Result<IScheduledAction, ScheduleActionError>>;
}

export const ScheduleActionUseCase =
    createAbstraction<IScheduleActionUseCase>("ScheduleActionUseCase");

export namespace ScheduleActionUseCase {
    export type Interface = IScheduleActionUseCase;
    export type Params = IScheduleActionParams;
    export type Error = ScheduleActionError;
}
