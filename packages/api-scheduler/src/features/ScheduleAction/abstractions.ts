import { createAbstraction, Result } from "@webiny/feature/api";
import type { IScheduledAction, ScheduledActionType } from "~/shared/abstractions.js";
import {
    InvalidScheduleDateError,
    ScheduledActionPersistenceError,
    SchedulerServiceError
} from "~/domain/errors.js";
import type { GenericRecord } from "@webiny/api/types.js";

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

interface IScheduleActionParams<T extends GenericRecord> {
    namespace: string;
    actionType: ScheduledActionType;
    targetId: string;
    scheduleFor: string;
    title: string;
    payload: T;
}

export interface IScheduleActionUseCase {
    execute<T extends GenericRecord>(
        params: IScheduleActionParams<T>
    ): Promise<Result<IScheduledAction<T>, ScheduleActionError>>;
}

export const ScheduleActionUseCase =
    createAbstraction<IScheduleActionUseCase>("ScheduleActionUseCase");

export namespace ScheduleActionUseCase {
    export type Interface = IScheduleActionUseCase;
    export type Params<T extends GenericRecord> = IScheduleActionParams<T>;
    export type Error = ScheduleActionError;
}
