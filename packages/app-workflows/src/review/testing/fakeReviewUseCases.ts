import { vi } from "vitest";
import type { Mock } from "vitest";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlags } from "~/review/testing/reviewFixtures.js";
import { createWorkflow } from "~/review/testing/createWorkflow.js";

export interface FakeReviewUseCases extends IReviewUseCases {
    getBoundWorkflow: Mock<IReviewUseCases["getBoundWorkflow"]>;
    invalidateWorkflows: Mock<IReviewUseCases["invalidateWorkflows"]>;
    getTargetReview: Mock<IReviewUseCases["getTargetReview"]>;
    getReview: Mock<IReviewUseCases["getReview"]>;
    listStepCandidates: Mock<IReviewUseCases["listStepCandidates"]>;
    listReviewStepCandidates: Mock<IReviewUseCases["listReviewStepCandidates"]>;
    requestReview: Mock<IReviewUseCases["requestReview"]>;
    startStep: Mock<IReviewUseCases["startStep"]>;
    takeOverStep: Mock<IReviewUseCases["takeOverStep"]>;
    reassignStep: Mock<IReviewUseCases["reassignStep"]>;
    approveStep: Mock<IReviewUseCases["approveStep"]>;
    rejectStep: Mock<IReviewUseCases["rejectStep"]>;
    cancelReview: Mock<IReviewUseCases["cancelReview"]>;
    listReviews: Mock<IReviewUseCases["listReviews"]>;
    cancelForDelete: Mock<IReviewUseCases["cancelForDelete"]>;
    restartStep: Mock<IReviewUseCases["restartStep"]>;
    getStepRun: Mock<IReviewUseCases["getStepRun"]>;
    listBlockingReviews: Mock<IReviewUseCases["listBlockingReviews"]>;
}

/*
 * Fake use cases with sensible defaults: the namespace has a workflow, the revision has no review,
 * every action resolves the default review, the list is empty and nothing is cancelled for delete, no task is found and nothing blocks
 * (all eighteen methods of `IReviewUseCases`). Tests override single methods with `mockResolvedValue`
 * or `mockRejectedValue`.
 */
export const createFakeUseCases = (): FakeReviewUseCases => {
    const review = createReview();
    const workflow = createWorkflow();
    const reviewWithFlags = createReviewWithFlags(review);
    const emptyList = { items: [], meta: { cursor: null, hasMoreItems: false } };
    return {
        getBoundWorkflow: vi.fn().mockResolvedValue(workflow),
        invalidateWorkflows: vi.fn(),
        getTargetReview: vi.fn().mockResolvedValue(null),
        getReview: vi.fn().mockResolvedValue(reviewWithFlags),
        listStepCandidates: vi.fn().mockResolvedValue([]),
        listReviewStepCandidates: vi.fn().mockResolvedValue([]),
        requestReview: vi.fn().mockResolvedValue(review),
        startStep: vi.fn().mockResolvedValue(review),
        takeOverStep: vi.fn().mockResolvedValue(review),
        reassignStep: vi.fn().mockResolvedValue(review),
        approveStep: vi.fn().mockResolvedValue(review),
        rejectStep: vi.fn().mockResolvedValue(review),
        cancelReview: vi.fn().mockResolvedValue(review),
        listReviews: vi.fn().mockResolvedValue(emptyList),
        cancelForDelete: vi.fn().mockResolvedValue([]),
        restartStep: vi.fn().mockResolvedValue(review),
        getStepRun: vi.fn().mockResolvedValue(null),
        listBlockingReviews: vi.fn().mockResolvedValue([])
    };
};
