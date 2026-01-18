import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import {
    ScheduledActionNotFoundError,
    ScheduledActionPersistenceError,
    SchedulerServiceError
} from "@webiny/api-scheduler/domain/errors.js";

/**
 * CancelScheduledEntryActionUseCase - Cancel a scheduled CMS entry action
 *
 * This is a convenience use case for canceling scheduled CMS entry actions.
 */

export interface ICancelScheduledEntryActionErrors {
    notFound: ScheduledActionNotFoundError;
    persistence: ScheduledActionPersistenceError;
    schedulerService: SchedulerServiceError;
}

type CancelScheduledEntryActionError =
    ICancelScheduledEntryActionErrors[keyof ICancelScheduledEntryActionErrors];

export interface ICancelScheduledEntryActionUseCase {
    execute(scheduleId: string): Promise<Result<void, CancelScheduledEntryActionError>>;
}

export const CancelScheduledEntryActionUseCase =
    createAbstraction<ICancelScheduledEntryActionUseCase>("CancelScheduledEntryActionUseCase");

export namespace CancelScheduledEntryActionUseCase {
    export type Interface = ICancelScheduledEntryActionUseCase;
    export type Error = CancelScheduledEntryActionError;
}
