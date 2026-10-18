import { Result } from "@webiny/feature/api";
import { INSPECTION_CANDIDATE_LIMIT } from "~/constants.js";
import { reviewStepConfigSchema } from "~/domain/workflow/reviewStepConfigSchema.js";
import { WorkflowValidationError } from "~/domain/workflow/errors.js";
import { findReviewStepConfigProblem } from "~/domain/workflow/findReviewStepConfigProblem.js";
import { findRuleWithoutTarget } from "~/domain/workflow/findRuleWithoutTarget.js";
import {
    getRuleTargetMissingMessage,
    RULE_TARGET_FIELD,
    RULE_TARGET_TEAM_OUTSIDE_TEAMS_MESSAGE
} from "~/domain/workflow/ruleErrorMessages.js";
import { RoutingDependencyError } from "~/domain/routing/errors.js";
import { findNarrowedTeamId } from "~/domain/routing/findNarrowedTeamId.js";
import { toInspectionTrace } from "~/domain/routing/toInspectionTrace.js";
import type { RoutingEvaluation } from "~/domain/routing/types.js";
import { RoutingEvaluatorService } from "~/features/routing/RoutingEvaluatorService/index.js";
import { InspectRoutingUseCase as UseCase } from "./abstractions.js";

class InspectRoutingUseCaseImpl implements UseCase.Interface {
    constructor(private routing: RoutingEvaluatorService.Interface) {}

    async execute(input: UseCase.Input): UseCase.Return {
        // A rule without a target is named by its id, before the schema reports it by index. The
        // editor tests incomplete rules too, so this is a message for Test routing (R288).
        const withoutTarget = findRuleWithoutTarget(input.stepConfig);
        if (withoutTarget) {
            return Result.fail(
                new WorkflowValidationError(getRuleTargetMissingMessage(null), {
                    field: RULE_TARGET_FIELD,
                    ruleId: withoutTarget.ruleId
                })
            );
        }

        const parsed = reviewStepConfigSchema.safeParse(input.stepConfig);
        if (!parsed.success) {
            const [issue] = parsed.error.issues;
            return Result.fail(
                new WorkflowValidationError(
                    `The step configuration is invalid: ${issue?.message ?? "unknown error"}`
                )
            );
        }
        // Save refuses a step without teams and a team target outside the step's teams
        // (spec 4.1, 6); the inspector does too, before any lookup.
        const problem = findReviewStepConfigProblem(parsed.data);
        if (problem?.type === "noTeams") {
            return Result.fail(
                new WorkflowValidationError(
                    "The step configuration is invalid: the step needs at least one team."
                )
            );
        }
        if (problem?.type === "teamTargetOutsideTeams") {
            return Result.fail(
                new WorkflowValidationError(RULE_TARGET_TEAM_OUTSIDE_TEAMS_MESSAGE, {
                    field: RULE_TARGET_FIELD,
                    ruleId: problem.ruleId
                })
            );
        }

        // An unsaved config has no stored workflow: no round-robin history, no pick. Read access
        // is checked at folder level as the request identity (A47). Inspector mode
        // explains every rule (R289).
        let evaluated: Result<RoutingEvaluation, RoutingDependencyError>;
        try {
            evaluated = await this.routing.evaluate({
                config: parsed.data,
                model: input.model,
                workflowId: null,
                reviewId: null,
                stepId: "",
                requesterId: input.requesterId,
                pickedUserId: null,
                folder: input.folder ? { ...input.folder } : null,
                read: { type: "folder", folderId: input.folder?.id ?? null },
                now: input.now,
                explain: true
            });
        } catch (error) {
            return Result.fail(
                new RoutingDependencyError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (evaluated.isFail()) {
            return Result.fail(evaluated.error);
        }
        const evaluation = evaluated.value;

        const strategyOrder = evaluation.strategyOrder ?? [];
        const firstCandidates = strategyOrder.slice(0, INSPECTION_CANDIDATE_LIMIT);
        const candidateIds = firstCandidates.map(candidate => candidate.id);
        const narrowedTeamId = findNarrowedTeamId(parsed.data.assignment.rules, evaluation.ruleId);

        return Result.ok({
            owner: evaluation.owner
                ? { id: evaluation.owner.id, displayName: evaluation.owner.displayName }
                : null,
            source: evaluation.source,
            ruleId: evaluation.ruleId,
            strategy: evaluation.strategy,
            trace: toInspectionTrace(evaluation.trace),
            skipped: evaluation.skipped.map(item => ({ ...item })),
            narrowedTeamId,
            candidateIds,
            candidateCount: strategyOrder.length
        });
    }
}

export const InspectRoutingUseCase = UseCase.createImplementation({
    implementation: InspectRoutingUseCaseImpl,
    dependencies: [RoutingEvaluatorService]
});
