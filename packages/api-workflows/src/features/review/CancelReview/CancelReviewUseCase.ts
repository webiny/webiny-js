import { Result } from "@webiny/feature/api";
import { Review } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewSaver } from "../ReviewSaver/abstractions.js";
import { CancelReviewUseCase as UseCase } from "./abstractions.js";

class CancelReviewUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: ReviewRepository.Interface,
        private saver: ReviewSaver.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const loaded = await this.repository.get(input.reviewId);
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }
        const review = Review.fromData(loaded.value);

        const cancelled = review.cancel({ actor: input.actor, now: new Date().toISOString() });
        if (cancelled.isFail()) {
            return Result.fail(cancelled.error);
        }

        return this.saver.save(review);
    }
}

export const CancelReviewUseCase = UseCase.createImplementation({
    implementation: CancelReviewUseCaseImpl,
    dependencies: [ReviewRepository, ReviewSaver]
});
