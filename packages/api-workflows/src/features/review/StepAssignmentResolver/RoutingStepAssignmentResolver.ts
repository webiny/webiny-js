import { Logger } from "@webiny/api-core/features/logger/index.js";
import { parseReviewStepConfig } from "~/domain/workflow/reviewStepConfigSchema.js";
import { createRoutingFailedResolution } from "~/domain/routing/createRoutingFailedResolution.js";
import { toStepAssignmentResolution } from "~/domain/routing/toStepAssignmentResolution.js";
import { ROUTING_FAILED_REASON } from "~/domain/routing/reasons.js";
import { RoutingEvaluatorService } from "~/features/routing/RoutingEvaluatorService/abstractions.js";
import { StepAssignmentResolver } from "./abstractions.js";
import { hasErrorSource } from "~/domain/hasErrorSource.js";

/**
 * Step reach routing (spec 6, R110): pick, rules, strategy, pool, through
 * `RoutingEvaluatorService`. Never blocks the review (R116): a failed lookup gives the pool with a
 * fixed reason, keeping what the evaluator had decided (the narrowed teams, a team-target rule,
 * the skips gathered); a throwing read check gives the pool of the step's teams without skips.
 * The error is logged.
 */
class RoutingStepAssignmentResolverImpl implements StepAssignmentResolver.Interface {
    public constructor(
        private evaluator: RoutingEvaluatorService.Interface,
        private logger: Logger.Interface
    ) {}

    public async resolve(
        params: StepAssignmentResolver.Params
    ): Promise<StepAssignmentResolver.Resolution> {
        // Save-time validation guarantees a parsable config. An unparsable one (edited storage)
        // leaves an empty pool; the review step type does not fail such a step (R116).
        const config = parseReviewStepConfig(params.step.config);
        if (!config) {
            return {
                owner: null,
                candidateTeamIds: [],
                assignment: { source: "pool" },
                records: [
                    {
                        kind: "outcome",
                        userId: null,
                        source: "pool",
                        ruleId: null,
                        by: null,
                        reason: null
                    }
                ]
            };
        }

        try {
            const evaluated = await this.evaluator.evaluate({
                config,
                model: params.review.model,
                workflowId: params.review.workflowId,
                // Least loaded does not count the review being routed (its previous step).
                reviewId: params.review.id,
                stepId: params.step.id,
                requesterId: params.review.createdBy.id,
                pickedUserId: params.step.pickedUserId,
                // The target's current folder: moves are refused while a review is in progress
                // (D84, R55). Its ancestors are read now, through the folder port (R130).
                folder: params.review.targetContext.folder,
                read: {
                    type: "target",
                    targetId: params.review.targetId,
                    targetRevisionId: params.review.targetRevisionId
                },
                now: params.now
            });
            if (evaluated.isFail()) {
                this.logger.error(
                    {
                        err: hasErrorSource(evaluated.error)
                            ? evaluated.error.source
                            : evaluated.error,
                        reviewId: params.review.id,
                        stepId: params.step.id
                    },
                    ROUTING_FAILED_REASON
                );
                return createRoutingFailedResolution(
                    evaluated.error.decided ?? {
                        candidateTeamIds: config.teams,
                        ruleId: null,
                        skips: []
                    }
                );
            }
            return toStepAssignmentResolution(evaluated.value);
        } catch (error) {
            this.logger.error(
                { err: error, reviewId: params.review.id, stepId: params.step.id },
                ROUTING_FAILED_REASON
            );
            return createRoutingFailedResolution({
                candidateTeamIds: config.teams,
                ruleId: null,
                skips: []
            });
        }
    }
}

export const RoutingStepAssignmentResolver = StepAssignmentResolver.createImplementation({
    implementation: RoutingStepAssignmentResolverImpl,
    dependencies: [RoutingEvaluatorService, Logger]
});
