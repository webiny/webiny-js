import { Result } from "@webiny/feature/api";
import { Review } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewSaver } from "../ReviewSaver/abstractions.js";
import { StartReviewStepUseCase as UseCase } from "./abstractions.js";

class StartReviewStepUseCaseImpl implements UseCase.Interface {
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

        const started = review.start({
            stepId: input.stepId,
            actor: input.actor,
            actorTeamIds: input.actorTeamIds,
            now: new Date().toISOString()
        });
        if (started.isFail()) {
            return Result.fail(started.error);
        }

        return this.saver.save(review);
    }
}

export const StartReviewStepUseCase = UseCase.createImplementation({
    implementation: StartReviewStepUseCaseImpl,
    dependencies: [ReviewRepository, ReviewSaver]
});
