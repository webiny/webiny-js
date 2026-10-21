import { Result } from "@webiny/feature/api";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import type { ReviewData } from "~/domain/review/types.js";
import { CancelReviewUseCase } from "../CancelReview/abstractions.js";
import { CancelTargetReviewsUseCase as UseCase } from "./abstractions.js";

/**
 * Each review goes through `CancelReviewUseCase`, so it is saved, `system.workflow` is cleared and
 * the cancelled event is published exactly as for a normal cancel. Stops at the first failure;
 * reviews cancelled before it stay cancelled.
 */
class CancelTargetReviewsUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: ReviewRepository.Interface,
        private cancelReview: CancelReviewUseCase.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const listed = await this.repository.listByTarget({
            model: input.model,
            targetId: input.targetId,
            targetRevisionId: input.targetRevisionId ?? undefined
        });
        if (listed.isFail()) {
            return Result.fail(listed.error);
        }

        const cancelled: ReviewData[] = [];
        for (const review of listed.value) {
            if (review.state !== "inProgress") {
                continue;
            }
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

export const CancelTargetReviewsUseCase = UseCase.createImplementation({
    implementation: CancelTargetReviewsUseCaseImpl,
    dependencies: [ReviewRepository, CancelReviewUseCase]
});
