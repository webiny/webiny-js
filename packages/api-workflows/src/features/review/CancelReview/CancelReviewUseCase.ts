import { Result } from "@webiny/feature/api";
import { Review } from "~/domain/review/Review.js";
import { ReviewTargetSyncError } from "~/domain/review/errors.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewTaskAbortService } from "~/features/stepRun/ReviewTaskAbortService/index.js";
import { ReviewSaver } from "../ReviewSaver/abstractions.js";
import { CancelReviewUseCase as CancelReviewUseCaseAbstraction } from "./abstractions.js";

class CancelReviewUseCaseImpl implements CancelReviewUseCaseAbstraction.Interface {
    constructor(
        private repository: ReviewRepository.Interface,
        private saver: ReviewSaver.Interface,
        private taskAbort: ReviewTaskAbortService.Interface
    ) {}

    async execute(
        input: CancelReviewUseCaseAbstraction.Input
    ): CancelReviewUseCaseAbstraction.Return {
        const loaded = await this.repository.get(input.reviewId);
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }
        const review = Review.fromData(loaded.value);

        // The running task of the current step, read before the cancel clears the current step
        // (D25, R151).
        const runningTaskId = review.getRunningTaskId();

        const cancelled = review.cancel({
            actor: input.actor,
            now: new Date().toISOString(),
            reason: input.reason
        });
        if (cancelled.isFail()) {
            return Result.fail(cancelled.error);
        }

        const saved = await this.saver.save(review);
        // Abort once the cancel is persisted: the save succeeded, or only the target sync failed
        // (R16) and the review is cancelled all the same. A failed save leaves the review in
        // progress, so its task keeps running. An abort failure is logged by the service and never
        // changes the result (R151).
        if (saved.isOk() || saved.error instanceof ReviewTargetSyncError) {
            await this.taskAbort.abort({
                taskIds: runningTaskId ? [runningTaskId] : [],
                message: "The review was cancelled."
            });
        }
        return saved;
    }
}

export const CancelReviewUseCase = CancelReviewUseCaseAbstraction.createImplementation({
    implementation: CancelReviewUseCaseImpl,
    dependencies: [ReviewRepository, ReviewSaver, ReviewTaskAbortService]
});
