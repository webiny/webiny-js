import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import type { CancelReviewUseCase } from "@webiny/api-workflows/features/review/CancelReview/index.js";
import type { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";

export interface CancelCmsEntryReviewInput {
    reviewId: string;
}

export interface ICancelCmsEntryReviewUseCaseErrors {
    guard: CmsEntryReviewGuardService.Error;
    notAuthorized: WorkflowsNotAuthorizedError;
    cancel: CancelReviewUseCase.Error;
}

type UseCaseError = ICancelCmsEntryReviewUseCaseErrors[keyof ICancelCmsEntryReviewUseCaseErrors];

export interface ICancelCmsEntryReviewUseCase {
    execute(input: CancelCmsEntryReviewInput): Promise<Result<ReviewData, UseCaseError>>;
}

/**
 * Cancel a CMS review (spec 5.1, D25, D133 point 7): read access to the target and the requester
 * or `workflows.reassign` (`canCancelByPermission`, 1b R41). Finished reviews fail in the engine
 * with `Workflows/Review/InvalidState`.
 */
export const CancelCmsEntryReviewUseCase = createAbstraction<ICancelCmsEntryReviewUseCase>(
    "CancelCmsEntryReviewUseCase"
);

export namespace CancelCmsEntryReviewUseCase {
    export type Interface = ICancelCmsEntryReviewUseCase;
    export type Input = CancelCmsEntryReviewInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
