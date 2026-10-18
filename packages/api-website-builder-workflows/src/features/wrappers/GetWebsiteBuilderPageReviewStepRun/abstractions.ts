import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewStepRunInfo } from "@webiny/api-workflows/domain/review/ReviewStepRunInfo.js";
import type { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import type { GetReviewStepRunUseCase } from "@webiny/api-workflows/features/stepRun/GetReviewStepRun/index.js";
import type { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";

export interface GetWebsiteBuilderPageReviewStepRunInput {
    reviewId: string;
    stepId: string;
    /** The step's current task id or the task id of one of its earlier runs. */
    taskId: string;
}

export interface IGetWebsiteBuilderPageReviewStepRunUseCaseErrors {
    guard: WbPageReviewGuardService.Error;
    notAuthorized: WorkflowsNotAuthorizedError;
    stepRun: GetReviewStepRunUseCase.Error;
}

type UseCaseError =
    IGetWebsiteBuilderPageReviewStepRunUseCaseErrors[keyof IGetWebsiteBuilderPageReviewStepRunUseCaseErrors];

export interface IGetWebsiteBuilderPageReviewStepRunUseCase {
    execute(
        input: GetWebsiteBuilderPageReviewStepRunInput
    ): Promise<Result<ReviewStepRunInfo | null, UseCaseError>>;
}

/**
 * The background task of one attempt of a page review step, as workflows shows it (R257, R258,
 * D90, D161): read access to the page and `editor` or `reassign` here, the step and task checks in
 * the engine. `null` means the task record is gone.
 */
export const GetWebsiteBuilderPageReviewStepRunUseCase =
    createAbstraction<IGetWebsiteBuilderPageReviewStepRunUseCase>(
        "GetWebsiteBuilderPageReviewStepRunUseCase"
    );

export namespace GetWebsiteBuilderPageReviewStepRunUseCase {
    export type Interface = IGetWebsiteBuilderPageReviewStepRunUseCase;
    export type Input = GetWebsiteBuilderPageReviewStepRunInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewStepRunInfo | null, UseCaseError>>;
}
