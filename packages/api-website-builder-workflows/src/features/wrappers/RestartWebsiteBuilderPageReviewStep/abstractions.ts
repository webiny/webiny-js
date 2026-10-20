import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import type { RestartReviewStepUseCase } from "@webiny/api-workflows/features/review/RestartReviewStep/index.js";
import type { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";

export interface RestartWebsiteBuilderPageReviewStepInput {
    reviewId: string;
    stepId: string;
}

export interface IRestartWebsiteBuilderPageReviewStepUseCaseErrors {
    guard: WbPageReviewGuardService.Error;
    notAuthorized: WorkflowsNotAuthorizedError;
    restart: RestartReviewStepUseCase.Error;
}

type UseCaseError =
    IRestartWebsiteBuilderPageReviewStepUseCaseErrors[keyof IRestartWebsiteBuilderPageReviewStepUseCaseErrors];

export interface IRestartWebsiteBuilderPageReviewStepUseCase {
    execute(
        input: RestartWebsiteBuilderPageReviewStepInput
    ): Promise<Result<ReviewData, UseCaseError>>;
}

/**
 * Run a failed page review step again (spec 5.1, D8, D34, D82, R153): read access to the page
 * and the requester or `reassign` here, the step's state in the engine.
 */
export const RestartWebsiteBuilderPageReviewStepUseCase =
    createAbstraction<IRestartWebsiteBuilderPageReviewStepUseCase>(
        "RestartWebsiteBuilderPageReviewStepUseCase"
    );

export namespace RestartWebsiteBuilderPageReviewStepUseCase {
    export type Interface = IRestartWebsiteBuilderPageReviewStepUseCase;
    export type Input = RestartWebsiteBuilderPageReviewStepInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
