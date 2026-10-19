import { Result } from "@webiny/feature/api";
import { Review } from "~/domain/review/Review.js";
import { ReviewReassignTargetInvalidError } from "~/domain/review/errors.js";
import { RoutingDependencyError } from "~/domain/routing/errors.js";
import { ROUTING_SKIP_REASONS } from "~/domain/routing/reasons.js";
import type { RoutingUserCheck } from "~/domain/routing/types.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { RoutingEvaluatorService } from "~/features/routing/RoutingEvaluatorService/index.js";
import { ReviewSaver } from "../ReviewSaver/abstractions.js";
import { ReassignReviewStepUseCase as UseCase } from "./abstractions.js";

class ReassignReviewStepUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: ReviewRepository.Interface,
        private routing: RoutingEvaluatorService.Interface,
        private saver: ReviewSaver.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const loaded = await this.repository.get(input.reviewId);
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }
        const data = loaded.value;
        const review = Review.fromData(data);

        // The state and same-owner rules first (R126): a refused reassign costs no user lookup,
        // settings read or read check.
        const allowed = review.checkReassignTo({ stepId: input.stepId, userId: input.userId });
        if (allowed.isFail()) {
            return Result.fail(allowed.error);
        }
        // The guard found the step: it is the review's current step.
        const step = data.steps.find(item => item.id === input.stepId)!;
        const now = new Date();

        // The chosen user is validated like a pick (R112); the read check runs as the request
        // identity inside the service. A throwing port is a routing failure too.
        let checked: Result<RoutingUserCheck, RoutingDependencyError>;
        try {
            checked = await this.routing.checkUser({
                userId: input.userId,
                teamIds: [...step.candidateTeamIds],
                requesterId: data.createdBy.id,
                model: data.model,
                read: {
                    type: "target",
                    targetId: data.targetId,
                    targetRevisionId: data.targetRevisionId
                },
                now
            });
        } catch (error) {
            return Result.fail(
                new RoutingDependencyError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (checked.isFail()) {
            return Result.fail(checked.error);
        }
        const { user, skipReason } = checked.value;
        if (skipReason || !user) {
            return Result.fail(
                new ReviewReassignTargetInvalidError({
                    reviewId: data.id,
                    stepId: input.stepId,
                    userId: input.userId,
                    reason: skipReason ?? ROUTING_SKIP_REASONS.notMember
                })
            );
        }

        const reassigned = review.reassign({
            stepId: input.stepId,
            actor: input.actor,
            owner: {
                type: "user",
                id: user.id,
                displayName: user.displayName,
                identityType: "admin"
            },
            now: now.toISOString()
        });
        if (reassigned.isFail()) {
            return Result.fail(reassigned.error);
        }

        return this.saver.save(review);
    }
}

export const ReassignReviewStepUseCase = UseCase.createImplementation({
    implementation: ReassignReviewStepUseCaseImpl,
    dependencies: [ReviewRepository, RoutingEvaluatorService, ReviewSaver]
});
