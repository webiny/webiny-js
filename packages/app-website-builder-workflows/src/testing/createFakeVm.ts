import type { TargetReviewKind } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import type { TargetReviewPresenter } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import type { TargetReviewStatus } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import { getEditorRules } from "@webiny/app-workflows/review/presentation/targetReview/getEditorRules.js";
import { createTargetReviewViewModel } from "@webiny/app-workflows/review/testing/createTargetReviewViewModel.js";

export type FakeReviewKind =
    | "loading"
    | "failed"
    | "noWorkflow"
    | "none"
    | "inProgress"
    | "approved"
    | "rejected";

interface FakeReviewState {
    status: TargetReviewStatus;
    reviewKind: TargetReviewKind;
}

const FAKE_REVIEW_STATES: Record<FakeReviewKind, FakeReviewState> = {
    loading: { status: "loading", reviewKind: "none" },
    failed: { status: "failed", reviewKind: "none" },
    noWorkflow: { status: "noWorkflow", reviewKind: "none" },
    none: { status: "none", reviewKind: "none" },
    inProgress: { status: "active", reviewKind: "inProgress" },
    approved: { status: "active", reviewKind: "approved" },
    rejected: { status: "active", reviewKind: "rejected" }
};

export const createFakeVm = (
    kind: FakeReviewKind,
    isUnpublished: boolean = false
): TargetReviewPresenter.ViewModel => {
    const { status, reviewKind } = FAKE_REVIEW_STATES[kind];
    const rules = getEditorRules({ status, reviewKind, isUnpublished });

    return createTargetReviewViewModel({
        status,
        reviewKind,
        allowsEditing: rules.allowsEditing,
        allowsPublishing: rules.allowsPublishing,
        publishDisabledReason: rules.publishDisabledReason,
        moveDisabledReason: rules.moveDisabledReason
    });
};
