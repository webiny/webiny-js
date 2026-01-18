import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import type { IScheduledAction } from "@webiny/api-scheduler";
import {
    ScheduledActionPersistenceError,
    InvalidScheduleDateError,
    SchedulerServiceError
} from "@webiny/api-scheduler/domain/errors.js";
import type { ModelNotFoundError } from "@webiny/api-headless-cms/domain/contentModel/errors.js";
import type { EntryNotFoundError } from "@webiny/api-headless-cms/domain/contentEntry/errors.js";

/**
 * ScheduleEntryActionUseCase - Schedule a CMS entry action (publish/unpublish)
 *
 * This is a convenience use case for scheduling CMS entry actions.
 * It handles:
 * - Immediate execution (via RunAction)
 * - Future scheduling (via ScheduleAction)
 * - Fetching entry title for schedule metadata
 */

export type ScheduleEntryActionType = "Publish" | "Unpublish";

export interface IScheduleEntryActionInput {
    modelId: string;
    targetId: string;
    actionType: ScheduleEntryActionType;
    immediately?: boolean;
    scheduleFor?: string;
}

export interface IScheduleEntryActionErrors {
    persistence: ScheduledActionPersistenceError;
    invalidDate: InvalidScheduleDateError;
    schedulerService: SchedulerServiceError;
    modelNotFound: ModelNotFoundError;
    entryNotFound: EntryNotFoundError;
}

type ScheduleEntryActionError = IScheduleEntryActionErrors[keyof IScheduleEntryActionErrors];

export interface IScheduleEntryActionUseCase {
    execute(
        input: IScheduleEntryActionInput
    ): Promise<Result<IScheduledAction, ScheduleEntryActionError>>;
}

export const ScheduleEntryActionUseCase = createAbstraction<IScheduleEntryActionUseCase>(
    "ScheduleEntryActionUseCase"
);

export namespace ScheduleEntryActionUseCase {
    export type Interface = IScheduleEntryActionUseCase;
    export type Input = IScheduleEntryActionInput;
    export type Error = ScheduleEntryActionError;
}
