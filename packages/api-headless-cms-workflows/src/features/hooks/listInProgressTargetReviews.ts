import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import type { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";

export interface InProgressReviewsLookup {
    getBoundWorkflow: GetBoundWorkflowUseCase.Interface;
    listTargetReviews: ListTargetReviewsUseCase.Interface;
}

export interface InProgressReviewsParams {
    /** Namespace id, e.g. "cms.article" or "wb.page". */
    model: string;
    targetId: string;
    /** Only this revision's review; every revision of the target when omitted. */
    targetRevisionId?: string;
}

/**
 * The in-progress reviews of a target (or one revision) on a model bound to a workflow; `[]` for
 * an unbound model, whose reviews are never looked up (D134). Lookup failures are thrown, so the
 * trash or delete is refused (fail closed). Shared by the CMS and WB trash and delete rules.
 */
export const listInProgressTargetReviews = async (
    lookup: InProgressReviewsLookup,
    params: InProgressReviewsParams
): Promise<ReviewData[]> => {
    const bound = await lookup.getBoundWorkflow.execute({ model: params.model });
    if (bound.isFail()) {
        throw bound.error;
    }
    if (!bound.value) {
        return [];
    }

    const reviews = await lookup.listTargetReviews.execute({
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
