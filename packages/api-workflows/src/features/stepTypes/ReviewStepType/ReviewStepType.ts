import { Result } from "@webiny/feature/api";
import { WorkflowValidationError } from "~/domain/workflow/errors.js";
import { findReviewStepConfigProblem } from "~/domain/workflow/findReviewStepConfigProblem.js";
import { findRuleWithoutTarget } from "~/domain/workflow/findRuleWithoutTarget.js";
import { getConfigIssueField } from "~/domain/workflow/getConfigIssueField.js";
import { getRuleTargetMissingMessage } from "~/domain/workflow/ruleErrorMessages.js";
import { RULE_TARGET_FIELD } from "~/domain/workflow/ruleErrorMessages.js";
import { RULE_TARGET_TEAM_OUTSIDE_TEAMS_MESSAGE } from "~/domain/workflow/ruleErrorMessages.js";
import { reviewStepConfigSchema } from "~/domain/workflow/reviewStepConfigSchema.js";
import { REVIEW_STEP_TYPE } from "~/domain/workflow/stepTypes.js";
import { StepAssignmentResolver } from "~/features/review/StepAssignmentResolver/abstractions.js";
import { StepType } from "~/features/stepTypes/StepType/abstractions.js";

const fail = (message: string, stepId: string, field: string, ruleId: string | null = null) => {
    return Result.fail(new WorkflowValidationError(message, { stepId, field, ruleId }));
};

/**
 * The built-in review step (spec 4.1, R131): a person reviews, the step is routed to a team
 * (spec 6). Reaching a step resolves its assignment (`StepAssignmentResolver`) and applies it.
 */
class ReviewStepTypeImpl implements StepType.Interface {
    public readonly type = REVIEW_STEP_TYPE;
    public readonly title = "Review";
    public readonly configSchema = reviewStepConfigSchema;

    public constructor(private resolver: StepAssignmentResolver.Interface) {}

    public async describeAvailability(): Promise<StepType.Availability> {
        return { available: true, unavailableReason: null };
    }

    public validate({ step }: StepType.ValidateParams) {
        // A rule without a target is named by its id, before the schema reports it by index.
        const withoutTarget = findRuleWithoutTarget(step.config);
        if (withoutTarget) {
            return fail(
                getRuleTargetMissingMessage(step.title),
                step.id,
                RULE_TARGET_FIELD,
                withoutTarget.ruleId
            );
        }

        const parsed = reviewStepConfigSchema.safeParse(step.config);
        if (!parsed.success) {
            const [issue] = parsed.error.issues;
            const field = getConfigIssueField(issue?.path ?? []);
            return fail(
                `Step "${step.title}" has an invalid configuration: ${issue?.message ?? "unknown error"}`,
                step.id,
                field
            );
        }

        // At least one team, and team targets among the step's teams (spec 4.1, 6). User targets
        // need a user lookup, so `StoreWorkflowUseCase` checks them after this validation (R122).
        const problem = findReviewStepConfigProblem(parsed.data);
        if (problem?.type === "noTeams") {
            return fail(`Step "${step.title}" needs at least one team.`, step.id, "config.teams");
        }
        if (problem?.type === "teamTargetOutsideTeams") {
            return fail(
                RULE_TARGET_TEAM_OUTSIDE_TEAMS_MESSAGE,
                step.id,
                RULE_TARGET_FIELD,
                problem.ruleId
            );
        }

        return Result.ok({ ...step, config: parsed.data });
    }

    public async reach({ review, step, actor, now }: StepType.ReachParams) {
        const resolution = await this.resolver.resolve({
            review: review.toData(),
            step,
            now: new Date(now)
        });
        return review.reach({ resolution, actor, now });
    }
}

export const ReviewStepType = StepType.createImplementation({
    implementation: ReviewStepTypeImpl,
    dependencies: [StepAssignmentResolver]
});
