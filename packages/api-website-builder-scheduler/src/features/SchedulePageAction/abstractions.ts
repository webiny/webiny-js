import { createAbstraction, Result } from "@webiny/feature/api";
import type { IScheduledAction } from "@webiny/api-scheduler";
import {
    InvalidScheduleDateError,
    ScheduledActionPersistenceError,
    SchedulerServiceError
} from "@webiny/api-scheduler/domain/errors.js";
import type { GetPageByIdUseCase } from "@webiny/api-website-builder/features/pages/GetPageById/abstractions.js";

/**
 * SchedulePageActionUseCase - Schedule a WB page action (publish/unpublish)
 *
 * This is a convenience use case for scheduling WB page actions.
 * It handles:
 * - Immediate execution (via RunAction)
 * - Future scheduling (via ScheduleAction)
 * - Fetching page title for schedule metadata
 */

export type SchedulePageActionType = "Publish" | "Unpublish";

// Pages have one fixed model, so no payload is needed beyond what the scheduler stores.
export interface ISchedulePageActionPayload {
    readonly _type: "Wb/Page";
}

export interface ISchedulePageActionWithPayload
    extends IScheduledAction<ISchedulePageActionPayload> {}

export interface ISchedulePageActionInput {
    targetId: string;
    actionType: SchedulePageActionType;
    immediately?: boolean;
    scheduleFor?: string;
}

export interface ISchedulePageActionErrors {
    persistence: ScheduledActionPersistenceError;
    invalidDate: InvalidScheduleDateError;
    schedulerService: SchedulerServiceError;
    pageError: GetPageByIdUseCase.Error;
}

type SchedulePageActionError = ISchedulePageActionErrors[keyof ISchedulePageActionErrors];

export interface ISchedulePageActionUseCase {
    execute(
        input: ISchedulePageActionInput
    ): Promise<Result<IScheduledAction<ISchedulePageActionPayload>, SchedulePageActionError>>;
}

export const SchedulePageActionUseCase = createAbstraction<ISchedulePageActionUseCase>(
    "SchedulePageActionUseCase"
);

export namespace SchedulePageActionUseCase {
    export type Interface = ISchedulePageActionUseCase;
    export type Input = ISchedulePageActionInput;
    export type Error = SchedulePageActionError;
}
