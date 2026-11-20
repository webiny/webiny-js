import { getEditorRules } from "@webiny/app-workflows/review/presentation/targetReview/getEditorRules.js";
import type { TargetReviewKind } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import type { TargetReviewStatus } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import { ReviewState } from "@webiny/app-workflows/review/domain/ReviewState.js";
import type { ReviewStateValue } from "@webiny/app-workflows/review/domain/ReviewState.js";
import type { CmsModelWorkflowPresenter } from "~/presentation/modelWorkflow/abstractions.js";

export interface RowPublishDisabledReasonParams {
    workflowStatus: CmsModelWorkflowPresenter.Status;
    // `meta.system.workflow.reviewState` of the row: `null` for no review or a cancelled one.
    reviewState: ReviewStateValue | null;
    // The revision was published before and is not published now.
    isUnpublished: boolean;
}

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
 * Why a list row may not be published, by the editor's own rules (`getEditorRules`), from what the
 * list already has: the row's review state and whether its model is bound to a workflow. `null`
 * means publishing is allowed. Pure.
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
