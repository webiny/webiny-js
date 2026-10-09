import { Result } from "@webiny/feature/api";
import { mdbid } from "@webiny/utils";
import { WorkflowRepository } from "~/domain/workflow/abstractions/WorkflowRepository.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { Review } from "~/domain/review/Review.js";
import {
    ReviewAlreadyActiveError,
    ReviewPersistenceError,
    ReviewTargetNotFoundError,
    ReviewWorkflowNotFoundError
} from "~/domain/review/errors.js";
import { ReviewTargetLoader } from "../ReviewTargetLoader/abstractions.js";
import { ReviewStepReacher } from "../ReviewStepReacher/abstractions.js";
import { ReviewSaver } from "../ReviewSaver/abstractions.js";
import { RequestReviewUseCase as UseCase } from "./abstractions.js";

class RequestReviewUseCaseImpl implements UseCase.Interface {
    constructor(
        private workflowRepository: WorkflowRepository.Interface,
        private reviewRepository: ReviewRepository.Interface,
        private targetLoaders: ReviewTargetLoader.Interface[],
        private stepReacher: ReviewStepReacher.Interface,
        private reviewSaver: ReviewSaver.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        // v1 binds at most one workflow to a model (D15).
        const workflows = await this.workflowRepository.list({
            where: { models_in: [input.model] },
            limit: 1
        });
        if (workflows.isFail()) {
            return Result.fail(new ReviewPersistenceError(workflows.error));
        }
        const [workflow] = workflows.value.items;
        if (!workflow) {
            return Result.fail(new ReviewWorkflowNotFoundError({ model: input.model }));
        }

        const active = await this.reviewRepository.getActiveByTarget({
            model: input.model,
            targetRevisionId: input.targetRevisionId
        });
        if (active.isFail()) {
            return Result.fail(active.error);
        }
        if (active.value) {
            return Result.fail(
                new ReviewAlreadyActiveError({
                    reviewId: active.value.id,
                    targetRevisionId: input.targetRevisionId
                })
            );
        }

        // Several loaders may match (e.g. a generic "cms.*" one and a specific one); the last
        // registered wins, the same rule as resolving a single registration.
        const loader = [...this.targetLoaders].reverse().find(item => item.canLoad(input.model));
        let target: ReviewTargetLoader.Target | null = null;
        if (loader) {
            try {
                target = await loader.load({
                    model: input.model,
                    targetId: input.targetId,
                    targetRevisionId: input.targetRevisionId
                });
            } catch (error) {
                // A crashing loader is an infrastructure failure, not a missing target: reporting
                // it as "not found" would hide the cause.
                return Result.fail(
                    new ReviewPersistenceError(
                        error instanceof Error ? error : new Error(String(error))
                    )
                );
            }
        }
        if (!target) {
            return Result.fail(
                new ReviewTargetNotFoundError({
                    model: input.model,
                    targetRevisionId: input.targetRevisionId
                })
            );
        }

        const now = new Date().toISOString();
        const requested = Review.request({
            id: mdbid(),
            workflow,
            model: input.model,
            targetId: input.targetId,
            targetRevisionId: input.targetRevisionId,
            title: target.title,
            targetContext: target.context,
            picks: input.picks ?? [],
            requester: input.actor,
            now
        });
        if (requested.isFail()) {
            return Result.fail(requested.error);
        }
        const review = requested.value;

        const reached = await this.stepReacher.reach({ review, actor: input.actor, now });
        if (reached.isFail()) {
            return Result.fail(reached.error);
        }

        return this.reviewSaver.save(review);
    }
}

export const RequestReviewUseCase = UseCase.createImplementation({
    implementation: RequestReviewUseCaseImpl,
    dependencies: [
        WorkflowRepository,
        ReviewRepository,
        [ReviewTargetLoader, { multiple: true }],
        ReviewStepReacher,
        ReviewSaver
    ]
});
