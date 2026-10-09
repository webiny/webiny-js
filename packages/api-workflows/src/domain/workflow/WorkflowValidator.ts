import { Result } from "@webiny/feature/api";
import { WorkflowValidationError } from "./errors.js";
import { reviewStepConfigSchema } from "./reviewStepConfigSchema.js";
import type { ReviewStepConfig, WorkflowStep, WorkflowValues } from "./types.js";

/** The only step type phase 1a accepts; phase 5 replaces this check with the `StepType` registry. */
export const REVIEW_STEP_TYPE = "review";

/**
 * Valid namespace ids in v1: `cms.<modelId>` and `wb.page` (spec 3). Whether a `cms.*` model exists
 * and is publishable is checked by the CMS workflows package on `WorkflowBeforeCreate|Update`.
 */
export const MODEL_NAMESPACE_PATTERN = /^(cms\.[A-Za-z0-9_-]+|wb\.page)$/;

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

const fail = (message: string) => {
    return Result.fail(new WorkflowValidationError(message));
};

/**
 * Validates a workflow on create and update (one path, spec 4.1, D41, D108). Checks that need
 * storage (model already bound to another workflow) live in `StoreWorkflowUseCase`; the "model is
 * publishable" check is a `WorkflowBeforeCreate` / `WorkflowBeforeUpdate` handler in the CMS
 * workflows package.
 */
export class WorkflowValidator {
    public static validate(
        values: WorkflowValues
    ): Result<WorkflowValues, WorkflowValidationError> {
        if (!values.id) {
            return fail("Workflow ID is required.");
        }
        if (!values.name || !values.name.trim()) {
            return fail("Workflow name is required.");
        }
        if (values.models.length !== 1 || !values.models[0]) {
            return fail("A workflow must be bound to exactly one model.");
        }
        const [model] = values.models;
        if (!MODEL_NAMESPACE_PATTERN.test(model)) {
            return fail(
                `Model "${model}" is not a valid model ID. Use "cms.<modelId>" or "wb.page".`
            );
        }
        if (values.steps.length === 0) {
            return fail("Add at least one step.");
        }

        const stepIds = new Set<string>();
        const steps: WorkflowStep[] = [];
        for (const step of values.steps) {
            const result = WorkflowValidator.validateStep(step, stepIds);
            if (result.isFail()) {
                return Result.fail(result.error);
            }
            steps.push(result.value);
        }

        return Result.ok({
            id: values.id,
            name: values.name.trim(),
            models: [...values.models],
            steps
        });
    }

    private static validateStep(
        step: WorkflowStep,
        stepIds: Set<string>
    ): Result<WorkflowStep, WorkflowValidationError> {
        if (!step.id) {
            return fail("Every step needs an ID.");
        }
        if (stepIds.has(step.id)) {
            return fail(`Step ID "${step.id}" is used more than once.`);
        }
        stepIds.add(step.id);

        if (!step.title || !step.title.trim()) {
            return fail(`Step "${step.id}" needs a title.`);
        }
        if (step.type !== REVIEW_STEP_TYPE) {
            return fail(
                `Step "${step.title}" uses the step type "${step.type}", which is not supported yet. Only "review" steps can be saved.`
            );
        }

        const config = WorkflowValidator.validateReviewConfig(step);
        if (config.isFail()) {
            return Result.fail(config.error);
        }

        // Normalise to what the mapper returns on read, so stored values equal returned values.
        const { description, ...rest } = step;
        const trimmedDescription = description?.trim();
        return Result.ok({
            ...rest,
            color: step.color ?? "",
            ...(trimmedDescription ? { description: trimmedDescription } : {}),
            notifications: step.notifications ?? [],
            config: config.value
        });
    }

    private static validateReviewConfig(
        step: WorkflowStep
    ): Result<ReviewStepConfig, WorkflowValidationError> {
        const config: UnknownRecord = isRecord(step.config) ? step.config : {};
        const teams = Array.isArray(config.teams) ? config.teams : [];
        if (teams.length === 0) {
            return fail(`Step "${step.title}" needs at least one team.`);
        }

        const assignment: UnknownRecord = isRecord(config.assignment) ? config.assignment : {};
        const rules = Array.isArray(assignment.rules) ? assignment.rules : [];
        for (const rule of rules) {
            if (!isRecord(rule) || !isRecord(rule.target)) {
                return fail(`Every routing rule in step "${step.title}" needs a target.`);
            }
        }

        const parsed = reviewStepConfigSchema.safeParse(step.config);
        if (!parsed.success) {
            const [issue] = parsed.error.issues;
            return fail(
                `Step "${step.title}" has an invalid configuration: ${issue?.message ?? "unknown error"}`
            );
        }

        // Spec 6: team targets must be among the step's teams. User targets need team lookups
        // and are validated in phase 4 (A7).
        for (const rule of parsed.data.assignment.rules) {
            if (rule.target.type === "team" && !parsed.data.teams.includes(rule.target.id)) {
                return fail(
                    `Routing rule "${rule.id}" in step "${step.title}" targets a team that is not one of the step's teams.`
                );
            }
        }

        return Result.ok(parsed.data);
    }
}
