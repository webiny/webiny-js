import type { Workflow } from "@webiny/api-workflows/domain/workflow/types.js";
import type { GetTargetReviewUseCase } from "@webiny/api-workflows/features/review/GetTargetReview/index.js";
import { ReviewPublishBlockedError } from "@webiny/api-workflows/domain/review/errors.js";

export interface ApprovedReviewParams {
    /** Namespace id, e.g. "cms.article". */
    model: string;
    targetRevisionId: string;
    /** The workflow bound to the model, from `findBoundWorkflow`. */
    workflow: Workflow;
}

/**
 * The publish rule (D79, D121, R53), shared by publish and republish once the model is known to
 * be bound: the revision's active review must be approved, otherwise `ReviewPublishBlockedError`.
 * An approved review stays active (D23), so an unpublished approved revision can be published
 * again. A failed lookup is thrown (fail closed).
 */
export const assertApprovedReview = async (
    getTargetReview: GetTargetReviewUseCase.Interface,
    params: ApprovedReviewParams
): Promise<void> => {
    const review = await getTargetReview.execute({
        model: params.model,
        targetRevisionId: params.targetRevisionId
    });
    if (review.isFail()) {
        throw review.error;
    }
    if (review.value?.state === "approved") {
        return;
    }

    throw new ReviewPublishBlockedError({
        model: params.model,
        targetRevisionId: params.targetRevisionId,
        workflowId: params.workflow.id,
        reviewState: review.value?.state ?? null
    });
};
