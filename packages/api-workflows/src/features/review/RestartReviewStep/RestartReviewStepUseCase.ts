import { Result } from "@webiny/feature/api";
import { Review } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewStepReacher } from "../ReviewStepReacher/abstractions.js";
import { ReviewSaver } from "../ReviewSaver/abstractions.js";
import { RestartReviewStepUseCase as UseCase } from "./abstractions.js";

class RestartReviewStepUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: ReviewRepository.Interface,
        private stepReacher: ReviewStepReacher.Interface,
        private saver: ReviewSaver.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const loaded = await this.repository.get(input.reviewId);
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }
        const review = Review.fromData(loaded.value);
        const now = new Date().toISOString();

        // Only a failed current step restarts; the failed attempt moves to `runs` (R140).
        const restarted = review.restart({ stepId: input.stepId, actor: input.actor, now });
        if (restarted.isFail()) {
            return Result.fail(restarted.error);
        }

        // The step is reached again as for a first run (D6): definition lookup, settings
        // re-validation and a new task as the requester (R149). When no task can be started the
        // reacher fails the step with the new reason and returns ok, so the step is never left
        // `pending` (R153). The restarter is only the actor of the facts.
        const reached = await this.stepReacher.reach({ review, actor: input.actor, now });
        if (reached.isFail()) {
            return Result.fail(reached.error);
        }

        return this.saver.save(review);
    }
}

export const RestartReviewStepUseCase = UseCase.createImplementation({
    implementation: RestartReviewStepUseCaseImpl,
    dependencies: [ReviewRepository, ReviewStepReacher, ReviewSaver]
});
