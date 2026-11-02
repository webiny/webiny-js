import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import type { CancelReviewUseCase } from "@webiny/api-workflows/features/review/CancelReview/index.js";
import type { WbPageReviewGuardService } from "../WbPageReviewGuardService/index.js";

export interface CancelWebsiteBuilderPageReviewInput {
    reviewId: string;
}

export interface ICancelWebsiteBuilderPageReviewUseCaseErrors {
    guard: WbPageReviewGuardService.Error;
    notAuthorized: WorkflowsNotAuthorizedError;
    cancel: CancelReviewUseCase.Error;
}

type UseCaseError =
    ICancelWebsiteBuilderPageReviewUseCaseErrors[keyof ICancelWebsiteBuilderPageReviewUseCaseErrors];

export interface ICancelWebsiteBuilderPageReviewUseCase {
    execute(input: CancelWebsiteBuilderPageReviewInput): Promise<Result<ReviewData, UseCaseError>>;
}

/**
 * Cancel a page review (spec 5.1, D25, D133 point 7): read access to the target and the requester
 * or `workflows.reassign` (`canCancelByPermission`, 1b R41). Finished reviews fail in the engine
 * with `Workflows/Review/InvalidState`.
 */
export const CancelWebsiteBuilderPageReviewUseCase =
    createAbstraction<ICancelWebsiteBuilderPageReviewUseCase>(
        "CancelWebsiteBuilderPageReviewUseCase"
    );

export namespace CancelWebsiteBuilderPageReviewUseCase {
    export type Interface = ICancelWebsiteBuilderPageReviewUseCase;
    export type Input = CancelWebsiteBuilderPageReviewInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
