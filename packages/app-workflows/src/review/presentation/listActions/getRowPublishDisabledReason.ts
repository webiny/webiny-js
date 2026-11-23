import { getEditorRules } from "~/review/presentation/targetReview/getEditorRules.js";
import type { TargetReviewKind } from "~/review/presentation/targetReview/abstractions.js";
import type { TargetReviewStatus } from "~/review/presentation/targetReview/abstractions.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import type { ReviewStateValue } from "~/review/domain/ReviewState.js";
import type { BoundWorkflowPresenter } from "~/review/presentation/boundWorkflow/abstractions.js";

export interface RowPublishDisabledReasonParams {
    workflowStatus: BoundWorkflowPresenter.Status;
    // The row's `system.workflow.reviewState`: `null` for no review.
    reviewState: ReviewStateValue | null;
    // The revision was published before and is not published now.
    isUnpublished: boolean;
}

// A cancelled review is no review (D75).
const toReviewKind = (reviewState: ReviewStateValue | null): TargetReviewKind => {
    if (reviewState === ReviewState.InProgress) {
        return "inProgress";
    }
    if (reviewState === ReviewState.Approved) {
        return "approved";
    }
    if (reviewState === ReviewState.Rejected) {
        return "rejected";
    }
    return "none";
};

const toStatus = (params: RowPublishDisabledReasonParams): TargetReviewStatus => {
    if (params.workflowStatus === "loading") {
        return "loading";
    }
    if (params.workflowStatus === "failed") {
        return "failed";
    }
    if (params.workflowStatus === "unbound") {
        return "noWorkflow";
    }
    if (toReviewKind(params.reviewState) === "none") {
        return "none";
    }
    return "active";
};

/*
 * Why a content list row may not be published, by the editor's own rules (`getEditorRules`), from
 * what the list already has: the row's review state and whether its namespace is bound to a
 * workflow. `null` means publishing is allowed. Shared by the Headless CMS and Website Builder
 * lists. Pure.
 */
export const getRowPublishDisabledReason = (
    params: RowPublishDisabledReasonParams
): string | null => {
    const rules = getEditorRules({
        status: toStatus(params),
        reviewKind: toReviewKind(params.reviewState),
        isUnpublished: params.isUnpublished
    });

    return rules.publishDisabledReason;
};
