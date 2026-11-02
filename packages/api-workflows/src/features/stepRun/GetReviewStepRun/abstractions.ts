import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewStepRunInfo } from "~/domain/review/ReviewStepRunInfo.js";
import type {
    ReviewNotFoundError,
    ReviewPersistenceError,
    ReviewStepRunNotFoundError
} from "~/domain/review/errors.js";

export interface GetReviewStepRunInput {
    reviewId: string;
    stepId: string;
    /** The step's current task id or the task id of one of its earlier runs. */
    taskId: string;
}

export interface IGetReviewStepRunUseCaseErrors {
    notFound: ReviewNotFoundError;
    persistence: ReviewPersistenceError;
    stepRunNotFound: ReviewStepRunNotFoundError;
}

type UseCaseError = IGetReviewStepRunUseCaseErrors[keyof IGetReviewStepRunUseCaseErrors];

export interface IGetReviewStepRunUseCase {
    execute(input: GetReviewStepRunInput): Promise<Result<ReviewStepRunInfo | null, UseCaseError>>;
}

/**
 * The background task of one attempt of an AI or automation step, as workflows shows it (R257,
 * D161). Internal (D132): no permission check; the app wrapper checks read access to the target
 * and `editor` or `reassign` (`canViewStepRunByPermission`). Only task ids of the step are read,
 * `null` means the task record is gone, and only the fields of `ReviewStepRunInfo` leave.
 */
export const GetReviewStepRunUseCase =
    createAbstraction<IGetReviewStepRunUseCase>("GetReviewStepRunUseCase");

export namespace GetReviewStepRunUseCase {
    export type Interface = IGetReviewStepRunUseCase;
    export type Input = GetReviewStepRunInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewStepRunInfo | null, UseCaseError>>;
}
