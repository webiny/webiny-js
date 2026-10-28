import type { TargetReviewPresenter } from "~/review/presentation/targetReview/abstractions.js";

// A target review view model of an in-progress review on step 2 of 3; override any field.
export const createTargetReviewViewModel = (
    overrides: Partial<TargetReviewPresenter.ViewModel> = {}
): TargetReviewPresenter.ViewModel => {
    return {
        status: "active",
        failureKind: null,
        reviewKind: "inProgress",
        targetTitle: "Spring campaign",
        namespace: "cms.article",
        targetRevisionId: "entry-1#0001",
        message: "Luka Perić is reviewing",
        lockText: "Editing, publishing and moving are locked while this revision is in review.",
        tile: "rate_review",
        stateTag: { label: "Review: In progress", variant: "accent-light" },
        stepStateTag: { label: "In review", variant: "accent-light" },
        stepStateTooltip: null,
        stepMeta: "Step 2 of 3: Legal sign-off",
        stepColor: "#2f80ed",
        ownerName: "Luka Perić",
        progress: {
            approved: 1,
            total: 3,
            segments: [
                {
                    stepId: "step-1",
                    title: "Editorial check",
                    state: "approved",
                    ownerLabel: "Ivan Horvat",
                    comment: null,
                    tag: { label: "Approved", variant: "success-light" },
                    message: null,
                    tooltip: null
                },
                {
                    stepId: "step-2",
                    title: "Legal sign-off",
                    state: "inReview",
                    ownerLabel: "Luka Perić",
                    comment: null,
                    tag: { label: "In review", variant: "accent-light" },
                    message: null,
                    tooltip: null
                },
                {
                    stepId: "step-3",
                    title: "Brand check",
                    state: "pending",
                    ownerLabel: "Not reached yet",
                    comment: null,
                    tag: { label: "Pending", variant: "neutral-base-outline" },
                    message: null,
                    tooltip: null
                }
            ]
        },
        actions: [],
        allowsEditing: false,
        allowsPublishing: false,
        publishDisabledReason: null,
        moveDisabledReason: null,
        reviewId: "review-1",
        openAction: null,
        busy: false,
        contentNotice: null,
        ...overrides
    };
};
