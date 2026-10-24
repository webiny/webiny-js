import { Result } from "@webiny/feature/api";
import type { ReviewData } from "~/domain/review/types.js";
import { CancelReviewUseCase } from "../CancelReview/abstractions.js";
import { CancelTargetReviewsUseCase as CancelTargetReviewsUseCaseAbstraction } from "./abstractions.js";

/**
 * Each review goes through `CancelReviewUseCase`, so it is saved, `system.workflow` is cleared and
 * the cancelled event is published exactly as for a normal cancel. Stops at the first failure;
 * reviews cancelled before it stay cancelled.
 */
class CancelTargetReviewsUseCaseImpl implements CancelTargetReviewsUseCaseAbstraction.Interface {
    constructor(private cancelReview: CancelReviewUseCase.Interface) {}

    async execute(
        input: CancelTargetReviewsUseCaseAbstraction.Input
    ): CancelTargetReviewsUseCaseAbstraction.Return {
        const cancelled: ReviewData[] = [];
        for (const review of input.reviews) {
            if (review.state !== "inProgress") {
                continue;
            }
            // `CancelReviewUseCase` reads the review again by id, although the caller passed it
            // confirmed: kept on purpose. It cancels what storage holds now, not the caller's
            // snapshot, and cancel-for-delete passes only in-progress reviews (one per revision at
            // most), so the extra read is one or two per delete.
            // oxlint-disable-next-line no-await-in-loop -- one cancel (a save and its events) per review; stops at the first failure.
            const result = await this.cancelReview.execute({
                reviewId: review.id,
                actor: input.actor,
                reason: input.reason
            });
            if (result.isFail()) {
                return Result.fail(result.error);
            }
            cancelled.push(result.value);
        }
        return Result.ok(cancelled);
    }
}

export const CancelTargetReviewsUseCase =
    CancelTargetReviewsUseCaseAbstraction.createImplementation({
        implementation: CancelTargetReviewsUseCaseImpl,
        dependencies: [CancelReviewUseCase]
    });
