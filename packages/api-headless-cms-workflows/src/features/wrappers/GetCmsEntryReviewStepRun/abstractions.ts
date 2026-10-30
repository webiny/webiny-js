import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewStepRunInfo } from "@webiny/api-workflows/domain/review/ReviewStepRunInfo.js";
import type { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import type { GetReviewStepRunUseCase } from "@webiny/api-workflows/features/stepRun/GetReviewStepRun/index.js";
import type { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";

export interface GetCmsEntryReviewStepRunInput {
    reviewId: string;
    stepId: string;
    /** The step's current task id or the task id of one of its earlier runs. */
    taskId: string;
}

export interface IGetCmsEntryReviewStepRunUseCaseErrors {
    guard: CmsEntryReviewGuardService.Error;
    notAuthorized: WorkflowsNotAuthorizedError;
    stepRun: GetReviewStepRunUseCase.Error;
}

type UseCaseError =
    IGetCmsEntryReviewStepRunUseCaseErrors[keyof IGetCmsEntryReviewStepRunUseCaseErrors];

export interface IGetCmsEntryReviewStepRunUseCase {
    execute(
        input: GetCmsEntryReviewStepRunInput
    ): Promise<Result<ReviewStepRunInfo | null, UseCaseError>>;
}

/**
 * The background task of one attempt of a CMS review step, as workflows shows it (R257, R258,
 * D90, D161): read access to the target and `editor` or `reassign` here, the step and task checks
 * in the engine. `null` means the task record is gone.
 */
export const GetCmsEntryReviewStepRunUseCase = createAbstraction<IGetCmsEntryReviewStepRunUseCase>(
    "GetCmsEntryReviewStepRunUseCase"
);

export namespace GetCmsEntryReviewStepRunUseCase {
    export type Interface = IGetCmsEntryReviewStepRunUseCase;
    export type Input = GetCmsEntryReviewStepRunInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewStepRunInfo | null, UseCaseError>>;
}
