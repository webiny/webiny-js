import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import {
    ScheduledActionNotFoundError,
    ScheduledActionPersistenceError,
    SchedulerServiceError
} from "@webiny/api-scheduler/domain/errors.js";

/**
 * CancelScheduledPageActionUseCase - Cancel a scheduled WB page action.
 *
 * This is a convenience use case for canceling scheduled WB page actions.
 */

export interface ICancelScheduledPageActionErrors {
    notFound: ScheduledActionNotFoundError;
    persistence: ScheduledActionPersistenceError;
    schedulerService: SchedulerServiceError;
}

type CancelScheduledPageActionError =
    ICancelScheduledPageActionErrors[keyof ICancelScheduledPageActionErrors];

export interface ICancelScheduledPageActionUseCase {
    execute(scheduleId: string): Promise<Result<void, CancelScheduledPageActionError>>;
}

export const CancelScheduledPageActionUseCase =
    createAbstraction<ICancelScheduledPageActionUseCase>("CancelScheduledPageActionUseCase");

export namespace CancelScheduledPageActionUseCase {
    export type Interface = ICancelScheduledPageActionUseCase;
    export type Error = CancelScheduledPageActionError;
}
