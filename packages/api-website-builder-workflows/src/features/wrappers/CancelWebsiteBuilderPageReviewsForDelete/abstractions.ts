import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type {
    ReviewActiveOnTrashAction,
    ReviewPersistenceError,
    ReviewTargetNotFoundError
} from "@webiny/api-workflows/domain/review/errors.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "@webiny/api-workflows/domain/permissions/errors.js";
import type { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import type { CancelTargetReviewsUseCase } from "@webiny/api-workflows/features/review/CancelTargetReviews/index.js";

export interface CancelWebsiteBuilderPageReviewsForDeleteInput {
    /** The page id (all revisions). */
    targetId: string;
    // Deleting one revision: only its review. Omitted for trash and page delete.
    targetRevisionId?: string | null;
    /** Recorded as the cancel reason: "content trashed" or "content deleted". */
    action: ReviewActiveOnTrashAction;
}

export interface ICancelWebsiteBuilderPageReviewsForDeleteUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    targetNotFound: ReviewTargetNotFoundError;
    persistence: ReviewPersistenceError;
    list: ListTargetReviewsUseCase.Error;
    cancel: CancelTargetReviewsUseCase.Error;
}

type UseCaseError =
    ICancelWebsiteBuilderPageReviewsForDeleteUseCaseErrors[keyof ICancelWebsiteBuilderPageReviewsForDeleteUseCaseErrors];

export interface ICancelWebsiteBuilderPageReviewsForDeleteUseCase {
    execute(
        input: CancelWebsiteBuilderPageReviewsForDeleteInput
    ): Promise<Result<ReviewData[], UseCaseError>>;
}

/**
 * The confirm path for trashing or deleting a page, or deleting one of its revisions, with a
 * review in progress (D134, R74, R235): cancels the page's in-progress reviews, or only the given
 * revision's, as the caller, who needs delete access to the page and no cancel right. The admin
 * calls it, then repeats the trash or delete.
 */
export const CancelWebsiteBuilderPageReviewsForDeleteUseCase =
    createAbstraction<ICancelWebsiteBuilderPageReviewsForDeleteUseCase>(
        "CancelWebsiteBuilderPageReviewsForDeleteUseCase"
    );

export namespace CancelWebsiteBuilderPageReviewsForDeleteUseCase {
    export type Interface = ICancelWebsiteBuilderPageReviewsForDeleteUseCase;
    export type Input = CancelWebsiteBuilderPageReviewsForDeleteInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData[], UseCaseError>>;
}
