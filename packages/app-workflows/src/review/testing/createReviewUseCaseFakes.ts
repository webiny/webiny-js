import { vi } from "vitest";
import type { Mock } from "vitest";
import type { ApproveReviewStepUseCase } from "~/review/useCases/approveReviewStep/abstractions.js";
import type { CancelReviewUseCase } from "~/review/useCases/cancelReview/abstractions.js";
import type { GetReviewUseCase } from "~/review/useCases/getReview/abstractions.js";
import type { GetStepRunUseCase } from "~/review/useCases/getStepRun/abstractions.js";
import type { ListReviewStepCandidatesUseCase } from "~/review/useCases/listReviewStepCandidates/abstractions.js";
import type { ReassignReviewStepUseCase } from "~/review/useCases/reassignReviewStep/abstractions.js";
import type { RejectReviewStepUseCase } from "~/review/useCases/rejectReviewStep/abstractions.js";
import type { RestartReviewStepUseCase } from "~/review/useCases/restartReviewStep/abstractions.js";
import type { StartReviewStepUseCase } from "~/review/useCases/startReviewStep/abstractions.js";
import type { TakeOverReviewStepUseCase } from "~/review/useCases/takeOverReviewStep/abstractions.js";
import { createReview } from "./reviewFixtures.js";
import { createReviewWithFlags } from "./reviewFixtures.js";

// One use case's `execute` as a vitest mock (R355).
export interface UseCaseFake<TExecute extends (...args: any[]) => any> {
    execute: Mock<TExecute>;
}

// One fake per use case the details drawer and the action dialogs inject, by use-case name.
export interface ReviewUseCaseFakes {
    getReview: UseCaseFake<GetReviewUseCase.Interface["execute"]>;
    getStepRun: UseCaseFake<GetStepRunUseCase.Interface["execute"]>;
    listReviewStepCandidates: UseCaseFake<ListReviewStepCandidatesUseCase.Interface["execute"]>;
    startReviewStep: UseCaseFake<StartReviewStepUseCase.Interface["execute"]>;
    takeOverReviewStep: UseCaseFake<TakeOverReviewStepUseCase.Interface["execute"]>;
    reassignReviewStep: UseCaseFake<ReassignReviewStepUseCase.Interface["execute"]>;
    approveReviewStep: UseCaseFake<ApproveReviewStepUseCase.Interface["execute"]>;
    rejectReviewStep: UseCaseFake<RejectReviewStepUseCase.Interface["execute"]>;
    cancelReview: UseCaseFake<CancelReviewUseCase.Interface["execute"]>;
    restartReviewStep: UseCaseFake<RestartReviewStepUseCase.Interface["execute"]>;
}

/*
 * Fresh fakes with the defaults of the old bundle fake: the review loads with its flags, no task
 * is found, nobody can be picked, and every action resolves the default review. Tests override one
 * with `mockResolvedValue` or `mockRejectedValue`.
 */
export const createReviewUseCaseFakes = (): ReviewUseCaseFakes => {
    const review = createReview();
    const reviewWithFlags = createReviewWithFlags(review);
    return {
        getReview: {
            execute: vi
                .fn<GetReviewUseCase.Interface["execute"]>()
                .mockResolvedValue(reviewWithFlags)
        },
        getStepRun: {
            execute: vi.fn<GetStepRunUseCase.Interface["execute"]>().mockResolvedValue(null)
        },
        listReviewStepCandidates: {
            execute: vi
                .fn<ListReviewStepCandidatesUseCase.Interface["execute"]>()
                .mockResolvedValue([])
        },
        startReviewStep: {
            execute: vi.fn<StartReviewStepUseCase.Interface["execute"]>().mockResolvedValue(review)
        },
        takeOverReviewStep: {
            execute: vi
                .fn<TakeOverReviewStepUseCase.Interface["execute"]>()
                .mockResolvedValue(review)
        },
        reassignReviewStep: {
            execute: vi
                .fn<ReassignReviewStepUseCase.Interface["execute"]>()
                .mockResolvedValue(review)
        },
        approveReviewStep: {
            execute: vi
                .fn<ApproveReviewStepUseCase.Interface["execute"]>()
                .mockResolvedValue(review)
        },
        rejectReviewStep: {
            execute: vi.fn<RejectReviewStepUseCase.Interface["execute"]>().mockResolvedValue(review)
        },
        cancelReview: {
            execute: vi.fn<CancelReviewUseCase.Interface["execute"]>().mockResolvedValue(review)
        },
        restartReviewStep: {
            execute: vi
                .fn<RestartReviewStepUseCase.Interface["execute"]>()
                .mockResolvedValue(review)
        }
    };
};
