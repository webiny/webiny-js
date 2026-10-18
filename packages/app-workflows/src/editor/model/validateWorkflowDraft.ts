import { createJsonSchemaValidator } from "@webiny/app-admin/features/formModel/jsonSchema/createJsonSchemaValidator.js";
import { HEX_COLOUR_MESSAGE } from "~/editor/domain/stepColours.js";
import { isHexColour } from "~/editor/domain/isHexColour.js";
import { StepTypeId } from "~/editor/domain/StepTypeId.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import type { EditorStep } from "~/editor/domain/types.js";
import { getMissingRequiredSettings } from "./getMissingRequiredSettings.js";
import { readAiConfig } from "./readAiConfig.js";
import { readAutomationConfig } from "./readAutomationConfig.js";
import { readReviewConfig } from "./readReviewConfig.js";
import type { StepFieldError } from "./StepFieldError.js";
import type { StepValidationErrors } from "./StepFieldError.js";
import type { WorkflowDraftErrors } from "./StepFieldError.js";

export interface ValidateWorkflowDraftParams {
    name: string;
    steps: EditorStep[];
    automations: AutomationDefinition[];
    // False when the AI editor does not exist: an AI step is then read-only and never blocks Save.
    aiEditable: boolean;
}

const SETTINGS_FIELD = "config.settings";

function validateReviewStep(step: EditorStep): StepFieldError[] {
    const config = readReviewConfig(step.config);
    if (config.teams.length > 0) {
        return [];
    }
    return [{ field: "config.teams", message: "Choose at least one reviewing team." }];
}

function validateAutomationStep(
    step: EditorStep,
    automations: AutomationDefinition[]
): StepFieldError[] {
    const config = readAutomationConfig(step.config);
    const definition = automations.find(item => item.id === config.automationId);
    if (!definition || definition.settingsSchema === null) {
        return [];
    }

    const errors: StepFieldError[] = [];
    const reported = new Set<string>();
    const missing = getMissingRequiredSettings(definition.settingsSchema, config.settings);
    for (const setting of missing) {
        reported.add(setting.key);
        errors.push({
            field: `${SETTINGS_FIELD}.${setting.key}`,
            message: `${setting.label} is required.`
        });
    }

    const validator = createJsonSchemaValidator(definition.settingsSchema);
    const result = validator.validate(config.settings);
    for (const issue of result.issues) {
        if (reported.has(issue.path)) {
            continue;
        }
        const field = issue.path === "" ? SETTINGS_FIELD : `${SETTINGS_FIELD}.${issue.path}`;
        errors.push({ field, message: issue.message });
    }

    return errors;
}

function validateAiStep(step: EditorStep): StepFieldError[] {
    const config = readAiConfig(step.config);
    const errors: StepFieldError[] = [];
    if (config.instructions.trim() === "") {
        errors.push({ field: "config.instructions", message: "Enter instructions for the AI." });
    }
    if (config.model.trim() === "") {
        errors.push({ field: "config.model", message: "Choose an AI model." });
    }
    return errors;
}

function validateTypeConfig(
    step: EditorStep,
    params: ValidateWorkflowDraftParams
): StepFieldError[] {
    if (step.type === StepTypeId.Review) {
        return validateReviewStep(step);
    }
    if (step.type === StepTypeId.Automation) {
        return validateAutomationStep(step, params.automations);
    }
    if (step.type === StepTypeId.Ai && params.aiEditable) {
        return validateAiStep(step);
    }
    return [];
}

function validateStep(step: EditorStep, params: ValidateWorkflowDraftParams): StepFieldError[] {
    const errors: StepFieldError[] = [];
    if (step.title.trim() === "") {
        errors.push({ field: "title", message: "Enter a title for this step." });
    }
    if (step.color.startsWith("#") && !isHexColour(step.color)) {
        errors.push({ field: "color", message: HEX_COLOUR_MESSAGE });
    }
    const typeErrors = validateTypeConfig(step, params);

    return [...errors, ...typeErrors];
}

/*
 * The client-side checks that run before a save (R276, QBZ-12). A step error uses the server's
 * field vocabulary (R267), so the presenter marks client and server errors the same way. Stale
 * configuration (a team without members, a missing automation, a retired model) is a warning, not
 * a blocker, and is not checked here.
 */
export const validateWorkflowDraft = (params: ValidateWorkflowDraftParams): WorkflowDraftErrors => {
    const stepErrors: StepValidationErrors[] = [];
    for (const step of params.steps) {
        const errors = validateStep(step, params);
        if (errors.length > 0) {
            stepErrors.push({ stepId: step.id, errors });
        }
    }

    return {
        name: params.name.trim() === "" ? "Enter a workflow name." : null,
        steps: params.steps.length === 0 ? "Add at least one step." : null,
        stepErrors
    };
};
