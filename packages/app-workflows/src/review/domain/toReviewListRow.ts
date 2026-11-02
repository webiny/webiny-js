import type { ReviewListRow } from "./types.js";
import type { ReviewWithFlags } from "./types.js";

// One list item as an app-neutral row (R206): the namespace stays on the row.
export const toReviewListRow = (item: ReviewWithFlags): ReviewListRow => {
    const { review, flags } = item;
    const step = review.steps.find(candidate => candidate.id === review.currentStepId);
    return {
        namespace: review.namespace,
        reviewId: review.id,
        targetId: review.targetId,
        targetRevisionId: review.targetRevisionId,
        title: review.title,
        reviewState: review.state,
        stepId: review.currentStepId,
        stepTitle: step ? step.title : null,
        stepColor: step ? step.color : null,
        stepState: review.currentStepState,
        owner: step ? step.owner : null,
        requester: review.createdBy,
        lastChangedOn: review.lastChangedOn,
        contentTypeId: review.targetContext.modelId,
        flags
    };
};
