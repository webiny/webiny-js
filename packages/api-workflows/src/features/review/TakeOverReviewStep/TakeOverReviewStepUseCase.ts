import { Result } from "@webiny/feature/api";
import { Review } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewSaver } from "../ReviewSaver/abstractions.js";
import { TakeOverReviewStepUseCase as UseCase } from "./abstractions.js";

class TakeOverReviewStepUseCaseImpl implements UseCase.Interface {
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

        const takenOver = review.takeOver({
            stepId: input.stepId,
            actor: input.actor,
            actorTeamIds: input.actorTeamIds,
            now: new Date().toISOString()
        });
        if (takenOver.isFail()) {
            return Result.fail(takenOver.error);
        }

        return this.saver.save(review);
    }
}

export const TakeOverReviewStepUseCase = UseCase.createImplementation({
    implementation: TakeOverReviewStepUseCaseImpl,
    dependencies: [ReviewRepository, ReviewSaver]
});
