import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import type { RestartReviewStepUseCase } from "@webiny/api-workflows/features/review/RestartReviewStep/index.js";
import type { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";

export interface RestartCmsEntryReviewStepInput {
    reviewId: string;
    stepId: string;
}

export interface IRestartCmsEntryReviewStepUseCaseErrors {
    guard: CmsEntryReviewGuardService.Error;
    notAuthorized: WorkflowsNotAuthorizedError;
    restart: RestartReviewStepUseCase.Error;
}

type UseCaseError =
    IRestartCmsEntryReviewStepUseCaseErrors[keyof IRestartCmsEntryReviewStepUseCaseErrors];

export interface IRestartCmsEntryReviewStepUseCase {
    execute(input: RestartCmsEntryReviewStepInput): Promise<Result<ReviewData, UseCaseError>>;
}

/**
 * Run a failed CMS review step again (spec 5.1, D8, D34, D82, R153): read access to the target
 * and the requester or `reassign` here, the step's state in the engine.
 */
export const RestartCmsEntryReviewStepUseCase =
    createAbstraction<IRestartCmsEntryReviewStepUseCase>("RestartCmsEntryReviewStepUseCase");

export namespace RestartCmsEntryReviewStepUseCase {
    export type Interface = IRestartCmsEntryReviewStepUseCase;
    export type Input = RestartCmsEntryReviewStepInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
