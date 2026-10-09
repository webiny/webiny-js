import { Result } from "@webiny/feature/api";
import { Review } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewSaver } from "../ReviewSaver/abstractions.js";
import { RejectReviewStepUseCase as UseCase } from "./abstractions.js";

class RejectReviewStepUseCaseImpl implements UseCase.Interface {
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

        const rejected = review.reject({
            stepId: input.stepId,
            actor: input.actor,
            actorTeamIds: input.actorTeamIds,
            comment: input.comment ?? null,
            now: new Date().toISOString()
        });
        if (rejected.isFail()) {
            return Result.fail(rejected.error);
        }

        return this.saver.save(review);
    }
}

export const RejectReviewStepUseCase = UseCase.createImplementation({
    implementation: RejectReviewStepUseCaseImpl,
    dependencies: [ReviewRepository, ReviewSaver]
});
