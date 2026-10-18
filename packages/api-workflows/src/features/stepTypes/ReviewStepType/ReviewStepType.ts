import { Result } from "@webiny/feature/api";
import { WorkflowValidationError } from "~/domain/workflow/errors.js";
import { findReviewStepConfigProblem } from "~/domain/workflow/findReviewStepConfigProblem.js";
import { getConfigIssueField } from "~/domain/workflow/getConfigIssueField.js";
import { reviewStepConfigSchema } from "~/domain/workflow/reviewStepConfigSchema.js";
import { REVIEW_STEP_TYPE } from "~/domain/workflow/stepTypes.js";
import { StepAssignmentResolver } from "~/features/review/StepAssignmentResolver/abstractions.js";
import { StepType } from "~/features/stepTypes/StepType/abstractions.js";

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

const fail = (message: string, stepId: string, field: string) => {
    return Result.fail(new WorkflowValidationError(message, { stepId, field }));
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
        const config: UnknownRecord = isRecord(step.config) ? step.config : {};
        const assignment: UnknownRecord = isRecord(config.assignment) ? config.assignment : {};
        const rules = Array.isArray(assignment.rules) ? assignment.rules : [];
        for (const rule of rules) {
            if (!isRecord(rule) || !isRecord(rule.target)) {
                return fail(
                    `Every routing rule in step "${step.title}" needs a target.`,
                    step.id,
                    "config.assignment.rules"
                );
            }
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
                `Routing rule "${problem.ruleId}" in step "${step.title}" targets a team that is not one of the step's teams.`,
                step.id,
                "config.assignment.rules"
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
