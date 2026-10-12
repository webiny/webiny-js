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

export interface CancelCmsEntryReviewsForDeleteInput {
    /** Namespace id, `cms.<modelId>`. */
    model: string;
    /** The entry id. */
    targetId: string;
    /** Deleting one revision: only its review. Omitted for trash and entry delete. */
    targetRevisionId?: string | null;
    /** Recorded as the cancel reason: "content trashed" or "content deleted". */
    action: ReviewActiveOnTrashAction;
}

export interface ICancelCmsEntryReviewsForDeleteUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    targetNotFound: ReviewTargetNotFoundError;
    persistence: ReviewPersistenceError;
    list: ListTargetReviewsUseCase.Error;
    cancel: CancelTargetReviewsUseCase.Error;
}

type UseCaseError =
    ICancelCmsEntryReviewsForDeleteUseCaseErrors[keyof ICancelCmsEntryReviewsForDeleteUseCaseErrors];

export interface ICancelCmsEntryReviewsForDeleteUseCase {
    execute(
        input: CancelCmsEntryReviewsForDeleteInput
    ): Promise<Result<ReviewData[], UseCaseError>>;
}

/**
 * The confirm path for trashing or deleting a CMS entry or revision with a review in progress
 * (D134, R74): cancels the in-progress reviews as the caller, who needs delete access to the
 * content and no cancel right. The admin calls it, then repeats the trash or delete.
 */
export const CancelCmsEntryReviewsForDeleteUseCase =
    createAbstraction<ICancelCmsEntryReviewsForDeleteUseCase>(
        "CancelCmsEntryReviewsForDeleteUseCase"
    );

export namespace CancelCmsEntryReviewsForDeleteUseCase {
    export type Interface = ICancelCmsEntryReviewsForDeleteUseCase;
    export type Input = CancelCmsEntryReviewsForDeleteInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData[], UseCaseError>>;
}
