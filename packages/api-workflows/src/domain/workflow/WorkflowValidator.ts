import { Result } from "@webiny/feature/api";
import { WorkflowValidationError } from "./errors.js";
import type { WorkflowValidationErrorData } from "./errors.js";
import type { WorkflowStep, WorkflowValues } from "./types.js";

/**
 * Whether an app knows the model: `WorkflowModelParserService` parses it (each app adapter
 * registers its parser). Whether the model exists and is publishable is checked by the app's
 * workflows package on `WorkflowBeforeCreate|Update`.
 */
export type WorkflowModelCheck = (model: string) => boolean;

/**
 * Validates one step's type and config: the step type registry's `validate` (R131). Returns the
 * step with its normalised `config`.
 */
export type WorkflowStepValidator = (
    step: WorkflowStep
) => Result<WorkflowStep, WorkflowValidationError>;

const fail = (message: string, where: Partial<WorkflowValidationErrorData> = {}) => {
    return Result.fail(new WorkflowValidationError(message, where));
};

/**
 * Validates a workflow on create and update (one path, spec 4.1, D41, D108). It checks the
 * structure (id, name, one model an app knows, steps, step ids and titles) and normalises each step; the step
 * type and its config are checked by `validateStep`, which `StoreWorkflowUseCase` builds from the
 * step type registry. Checks that need storage (model already bound to another workflow) live in
 * `StoreWorkflowUseCase`; the "model is publishable" check is a `WorkflowBeforeCreate` /
 * `WorkflowBeforeUpdate` handler in the CMS workflows package.
 */
export class WorkflowValidator {
    public static validate(
        values: WorkflowValues,
        validateStep: WorkflowStepValidator,
        isKnownModel: WorkflowModelCheck
    ): Result<WorkflowValues, WorkflowValidationError> {
        if (!values.id) {
            return fail("Workflow ID is required.");
        }
        if (!values.name || !values.name.trim()) {
            return fail("Workflow name is required.", { field: "name" });
        }
        if (values.models.length !== 1 || !values.models[0]) {
            return fail("A workflow must be bound to exactly one model.", { field: "models" });
        }
        const [model] = values.models;
        if (!isKnownModel(model)) {
            return fail(`Model "${model}" is not supported.`, { field: "models" });
        }
        if (values.steps.length === 0) {
            return fail("Add at least one step.", { field: "steps" });
        }

        const stepIds = new Set<string>();
        const steps: WorkflowStep[] = [];
        for (const step of values.steps) {
            const result = WorkflowValidator.validateStep(step, stepIds, validateStep);
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
        stepIds: Set<string>,
        validateStep: WorkflowStepValidator
    ): Result<WorkflowStep, WorkflowValidationError> {
        if (!step.id) {
            return fail("Every step needs an ID.", { field: "steps" });
        }
        if (stepIds.has(step.id)) {
            return fail(`Step ID "${step.id}" is used more than once.`, {
                stepId: step.id,
                field: "id"
            });
        }
        stepIds.add(step.id);

        if (!step.title || !step.title.trim()) {
            return fail(`Step "${step.id}" needs a title.`, { stepId: step.id, field: "title" });
        }

        const validated = validateStep(step);
        if (validated.isFail()) {
            return Result.fail(validated.error);
        }

        // Normalise to what the mapper returns on read, so stored values equal returned values.
        const { description, ...rest } = validated.value;
        const trimmedDescription = description?.trim();
        return Result.ok({
            ...rest,
            color: validated.value.color ?? "",
            ...(trimmedDescription ? { description: trimmedDescription } : {}),
            notifications: validated.value.notifications ?? []
        });
    }
}
