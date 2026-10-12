import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";

export interface InProgressReviewsParams {
    /** Namespace id, e.g. "cms.article". */
    model: string;
    targetId: string;
    /** Only this revision's review; every revision of the target when omitted. */
    targetRevisionId?: string;
}

/**
 * The in-progress reviews of a target (or one revision). Callers look up the binding first with
 * `findBoundWorkflow`, so unbound models never get here (D134). A failed lookup is thrown, so the
 * guarded action is refused (fail closed).
 */
export const listInProgressTargetReviews = async (
    listTargetReviews: ListTargetReviewsUseCase.Interface,
    params: InProgressReviewsParams
): Promise<ReviewData[]> => {
    const reviews = await listTargetReviews.execute({
        model: params.model,
        targetId: params.targetId
    });
    if (reviews.isFail()) {
        throw reviews.error;
    }
    return reviews.value.filter(review => {
        if (review.state !== "inProgress") {
            return false;
        }
        return !params.targetRevisionId || review.targetRevisionId === params.targetRevisionId;
    });
};
