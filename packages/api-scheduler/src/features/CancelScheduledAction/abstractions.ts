import { createAbstraction, Result } from "@webiny/feature/api";
import {
    ScheduledActionNotFoundError,
    ScheduledActionPersistenceError,
    SchedulerServiceError
} from "~/domain/errors.js";

/**
 * CancelScheduledActionUseCase - Cancel a scheduled action
 *
 * Cancels both the CMS entry and the EventBridge schedule.
 * Used when a user manually cancels a scheduled action or when business logic
 * determines the action should no longer execute.
 */

export interface ICancelScheduledActionErrors {
    notFound: ScheduledActionNotFoundError;
    persistence: ScheduledActionPersistenceError;
    schedulerService: SchedulerServiceError;
}

type CancelScheduledActionError = ICancelScheduledActionErrors[keyof ICancelScheduledActionErrors];
export interface ICancelScheduledActionUseCaseParams {
    namespace: string;
    id: string;
}
export interface ICancelScheduledActionUseCase {
    execute(
        params: ICancelScheduledActionUseCaseParams
    ): Promise<Result<void, CancelScheduledActionError>>;
}

export const CancelScheduledActionUseCase = createAbstraction<ICancelScheduledActionUseCase>(
    "CancelScheduledActionUseCase"
);

export namespace CancelScheduledActionUseCase {
    export type Interface = ICancelScheduledActionUseCase;
    export type Error = CancelScheduledActionError;
    export type Params = ICancelScheduledActionUseCaseParams;
}
