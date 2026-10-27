import { Result } from "@webiny/feature/api";
import { Review } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewStepReacher } from "../ReviewStepReacher/abstractions.js";
import { ReviewSaver } from "../ReviewSaver/abstractions.js";
import { ApproveReviewStepUseCase as ApproveReviewStepUseCaseAbstraction } from "./abstractions.js";

class ApproveReviewStepUseCaseImpl implements ApproveReviewStepUseCaseAbstraction.Interface {
    constructor(
        private repository: ReviewRepository.Interface,
        private stepReacher: ReviewStepReacher.Interface,
        private saver: ReviewSaver.Interface
    ) {}

    async execute(
        input: ApproveReviewStepUseCaseAbstraction.Input
    ): ApproveReviewStepUseCaseAbstraction.Return {
        const loaded = await this.repository.get(input.reviewId);
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }
        const review = Review.fromData(loaded.value);
        const now = new Date().toISOString();

        const approved = review.approve({
            stepId: input.stepId,
            actor: input.actor,
            actorTeamIds: input.actorTeamIds,
            comment: input.comment ?? null,
            issues: input.issues,
            now
        });
        if (approved.isFail()) {
            return Result.fail(approved.error);
        }

        // The next step goes through the same step-reached path as step 1 (D6).
        const reached = await this.stepReacher.reach({ review, actor: input.actor, now });
        if (reached.isFail()) {
            return Result.fail(reached.error);
        }

        return this.saver.save(review);
    }
}

export const ApproveReviewStepUseCase = ApproveReviewStepUseCaseAbstraction.createImplementation({
    implementation: ApproveReviewStepUseCaseImpl,
    dependencies: [ReviewRepository, ReviewStepReacher, ReviewSaver]
});
