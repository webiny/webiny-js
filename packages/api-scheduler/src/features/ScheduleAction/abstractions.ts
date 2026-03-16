import { createAbstraction, Result } from "@webiny/feature/api";
import type { IScheduledAction, ScheduledActionType } from "~/shared/abstractions.js";
import {
    InvalidScheduleDateError,
    ScheduledActionPersistenceError,
    SchedulerServiceError,
    NamespaceHandlerNotFoundError
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
    namespaceHandlerNotFound: NamespaceHandlerNotFoundError;
    persistence: ScheduledActionPersistenceError;
    invalidDate: InvalidScheduleDateError;
    schedulerService: SchedulerServiceError;
}

type ScheduleActionError = IScheduleActionErrors[keyof IScheduleActionErrors];

export interface IScheduleActionParams {
    namespace: string;
    targetId: string;
    actionType: ScheduledActionType;
    scheduleFor: Date;
    immediately?: boolean;
}

export interface IScheduleActionUseCase {
    execute<T extends GenericRecord>(
        params: IScheduleActionParams
    ): Promise<Result<IScheduledAction<T>, ScheduleActionError>>;
}

export const ScheduleActionUseCase = createAbstraction<IScheduleActionUseCase>(
    "Scheduler/ScheduleActionUseCase"
);

export namespace ScheduleActionUseCase {
    export type Interface = IScheduleActionUseCase;
    export type Params = IScheduleActionParams;
    export type Error = ScheduleActionError;
}
