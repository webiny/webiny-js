import { vi } from "vitest";
import type { CancelReviewsForDeleteUseCase } from "~/review/useCases/cancelReviewsForDelete/abstractions.js";
import type { ListBlockingReviewsUseCase } from "~/review/useCases/listBlockingReviews/abstractions.js";
import type { UseCaseFake } from "./createReviewUseCaseFakes.js";

// One fake per use case the trash guard and the CMS bulk pre-check inject, by use-case name.
export interface TrashUseCaseFakes {
    cancelReviewsForDelete: UseCaseFake<CancelReviewsForDeleteUseCase.Interface["execute"]>;
    listBlockingReviews: UseCaseFake<ListBlockingReviewsUseCase.Interface["execute"]>;
}

/*
 * Fresh fakes (R355): nothing is cancelled and nothing blocks until a test says otherwise with
 * `mockImplementation`, `mockResolvedValue` or `mockRejectedValue`.
 */
export const createTrashUseCaseFakes = (): TrashUseCaseFakes => {
    return {
        cancelReviewsForDelete: {
            execute: vi
                .fn<CancelReviewsForDeleteUseCase.Interface["execute"]>()
                .mockResolvedValue([])
        },
        listBlockingReviews: {
            execute: vi.fn<ListBlockingReviewsUseCase.Interface["execute"]>().mockResolvedValue([])
        }
    };
};
