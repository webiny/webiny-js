import { Result } from "@webiny/feature/api";
import { Review } from "~/domain/review/Review.js";
import { ReviewValidationError } from "~/domain/review/errors.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { WorkflowRepository } from "~/domain/workflow/abstractions/WorkflowRepository.js";
import { REVIEW_STEP_TYPE } from "~/domain/workflow/stepTypes.js";
import { parseReviewStepConfig } from "~/domain/workflow/reviewStepConfigSchema.js";
import { RoutingDependencyError } from "~/domain/routing/errors.js";
import { ROUTING_SKIP_REASONS } from "~/domain/routing/reasons.js";
import type { RoutingMember, RoutingMembersParams, StepCandidate } from "~/domain/routing/types.js";
import { toStepMembersParams } from "~/domain/routing/toStepMembersParams.js";
import { RoutingEvaluatorService } from "~/features/routing/RoutingEvaluatorService/index.js";
import { ListStepCandidatesUseCase as UseCase } from "./abstractions.js";

/** A member as a picker row (R120): the exclusion's own reason first, then no read access. */
const toStepCandidate = (member: RoutingMember): StepCandidate => {
    if (member.exclusion) {
        return {
            id: member.id,
            displayName: member.displayName,
            excluded: true,
            excludedReason: member.exclusion.reason || ROUTING_SKIP_REASONS.excluded
        };
    }
    return {
        id: member.id,
        displayName: member.displayName,
        excluded: !member.canRead,
        excludedReason: member.canRead ? null : ROUTING_SKIP_REASONS.cannotRead
    };
};

class ListStepCandidatesUseCaseImpl implements UseCase.Interface {
    constructor(
        private workflowRepository: WorkflowRepository.Interface,
        private reviewRepository: ReviewRepository.Interface,
        private routing: RoutingEvaluatorService.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const now = new Date();
        let params: RoutingMembersParams;

        if ("reviewId" in input) {
            // Reassign: the review's snapshot, with the teams the step was reached with.
            const loaded = await this.reviewRepository.get(input.reviewId);
            if (loaded.isFail()) {
                return Result.fail(loaded.error);
            }
            const review = loaded.value;
            const step = review.steps.find(item => item.id === input.stepId);
            if (!step) {
                return Result.fail(
                    new ReviewValidationError(
                        `Step "${input.stepId}" does not exist in this review.`
                    )
                );
            }
            // The reassign transition's own rules: no candidates for a step it would refuse.
            const allowed = Review.fromData(review).checkReassign({ stepId: input.stepId });
            if (allowed.isFail()) {
                return Result.fail(allowed.error);
            }
            params = toStepMembersParams({ review, step, now });
        } else {
            // Request: the stored workflow's step, before any review exists.
            const loaded = await this.workflowRepository.get(input.workflowId);
            if (loaded.isFail()) {
                return Result.fail(loaded.error);
            }
            const workflow = loaded.value;
            if (!workflow.models.includes(input.model)) {
                return Result.fail(
                    new ReviewValidationError(
                        `The workflow "${workflow.name}" is not bound to the model "${input.model}".`
                    )
                );
            }
            const step = workflow.steps.find(item => item.id === input.stepId);
            if (!step) {
                return Result.fail(
                    new ReviewValidationError(
                        `Step "${input.stepId}" does not exist in workflow "${workflow.name}".`
                    )
                );
            }
            const config =
                step.type === REVIEW_STEP_TYPE ? parseReviewStepConfig(step.config) : null;
            if (!config) {
                return Result.fail(
                    new ReviewValidationError(`Step "${step.title}" is not a review step.`)
                );
            }
            params = {
                teamIds: [...config.teams],
                requesterId: input.requesterId,
                model: input.model,
                read: {
                    type: "target",
                    targetId: input.targetId,
                    targetRevisionId: input.targetRevisionId
                },
                now
            };
        }

        // Members, exclusions and read checks (as the request identity) in one place.
        let listed: Result<RoutingMember[], RoutingDependencyError>;
        try {
            listed = await this.routing.listMembers(params);
        } catch (error) {
            return Result.fail(
                new RoutingDependencyError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (listed.isFail()) {
            return Result.fail(listed.error);
        }

        return Result.ok(
            listed.value.map(toStepCandidate).sort((a, b) => {
                return a.displayName.localeCompare(b.displayName) || a.id.localeCompare(b.id);
            })
        );
    }
}

export const ListStepCandidatesUseCase = UseCase.createImplementation({
    implementation: ListStepCandidatesUseCaseImpl,
    dependencies: [WorkflowRepository, ReviewRepository, RoutingEvaluatorService]
});
