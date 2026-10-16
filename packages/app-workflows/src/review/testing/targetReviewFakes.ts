import { vi } from "vitest";
import type { Mock } from "vitest";
import type { TargetReviewPresenter } from "~/review/presentation/targetReview/abstractions.js";

export const createViewModel = (
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
        stepMeta: "Step 2 of 3: Legal sign-off",
        ownerMeta: "Owner: Luka Perić",
        progress: {
            approved: 1,
            total: 3,
            segments: [
                {
                    stepId: "step-1",
                    title: "Editorial check",
                    state: "approved",
                    ownerLabel: "Ivan Horvat",
                    comment: null
                },
                {
                    stepId: "step-2",
                    title: "Legal sign-off",
                    state: "inReview",
                    ownerLabel: "Luka Perić",
                    comment: null
                },
                {
                    stepId: "step-3",
                    title: "Brand check",
                    state: "pending",
                    ownerLabel: "Not reached yet",
                    comment: null
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
        ...overrides
    };
};

export interface FakeTargetReviewPresenter extends TargetReviewPresenter.Interface {
    init: Mock<TargetReviewPresenter.Interface["init"]>;
    setContext: Mock<TargetReviewPresenter.Interface["setContext"]>;
    refresh: Mock<TargetReviewPresenter.Interface["refresh"]>;
    actionDone: Mock<TargetReviewPresenter.Interface["actionDone"]>;
    openAction: Mock<TargetReviewPresenter.Interface["openAction"]>;
    closeAction: Mock<TargetReviewPresenter.Interface["closeAction"]>;
    dispose: Mock<TargetReviewPresenter.Interface["dispose"]>;
}

// A presenter that exposes a fixed view model and records every command.
export const createFakePresenter = (
    vm: TargetReviewPresenter.ViewModel = createViewModel()
): FakeTargetReviewPresenter => {
    return {
        vm,
        init: vi.fn().mockResolvedValue(undefined),
        setContext: vi.fn(),
        refresh: vi.fn().mockResolvedValue(undefined),
        actionDone: vi.fn().mockResolvedValue(undefined),
        openAction: vi.fn(),
        closeAction: vi.fn(),
        dispose: vi.fn()
    };
};
