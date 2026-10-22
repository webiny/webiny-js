import { Result } from "@webiny/feature/api";
import { Review } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewSaver } from "../ReviewSaver/abstractions.js";
import { StartReviewStepUseCase as StartReviewStepUseCaseAbstraction } from "./abstractions.js";

class StartReviewStepUseCaseImpl implements StartReviewStepUseCaseAbstraction.Interface {
    constructor(
        private repository: ReviewRepository.Interface,
        private saver: ReviewSaver.Interface
    ) {}

    async execute(
        input: StartReviewStepUseCaseAbstraction.Input
    ): StartReviewStepUseCaseAbstraction.Return {
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

export const StartReviewStepUseCase = StartReviewStepUseCaseAbstraction.createImplementation({
    implementation: StartReviewStepUseCaseImpl,
    dependencies: [ReviewRepository, ReviewSaver]
});
