import { Result } from "@webiny/feature/api";
import { WorkflowValidationError } from "~/domain/workflow/errors.js";
import { AUTOMATION_STEP_TYPE } from "~/domain/workflow/stepTypes.js";
import { automationStepConfigSchema } from "~/domain/automation/automationStepConfigSchema.js";
import { matchesAutomationScope } from "~/domain/automation/matchesAutomationScope.js";
import { parseAutomationSettings } from "~/domain/automation/parseAutomationSettings.js";
import { AutomationDefinitionRegistryService } from "~/features/automation/AutomationDefinitionRegistryService/abstractions.js";
import { StepType } from "~/features/stepTypes/StepType/abstractions.js";

const fail = (message: string) => {
    return Result.fail(new WorkflowValidationError(message));
};

/**
 * The built-in automation step (spec 7.2, R133): runs a developer-written `AutomationDefinition`
 * chosen by `config.automationId`. Save-time validation checks the definition exists, covers the
 * workflow's models and accepts the settings (D35, D37, R137). `reach` is filled in Task 10.
 */
class AutomationStepTypeImpl implements StepType.Interface {
    public readonly type = AUTOMATION_STEP_TYPE;
    public readonly title = "Automation";
    public readonly configSchema = automationStepConfigSchema;

    public constructor(private definitions: AutomationDefinitionRegistryService.Interface) {}

    public async describeAvailability(): Promise<StepType.Availability> {
        if (this.definitions.list().length === 0) {
            return { available: false, unavailableReason: "No automation is defined." };
        }
        return { available: true, unavailableReason: null };
    }

    public validate({ step, workflow }: StepType.ValidateParams) {
        const shell = automationStepConfigSchema.safeParse(step.config);
        if (!shell.success) {
            return fail(`Step "${step.title}" needs an automation.`);
        }
        const { automationId, settings } = shell.data;

        const definition = this.definitions.get(automationId);
        if (!definition) {
            return fail(
                `Step "${step.title}" uses the automation "${automationId}", which is not defined.`
            );
        }
        if (!matchesAutomationScope(definition.models, workflow.models)) {
            return fail(
                `Automation "${automationId}" is not available for this workflow's models.`
            );
        }

        const parsed = parseAutomationSettings(definition, settings);
        if (parsed.isFail()) {
            return fail(`Step "${step.title}" settings are not valid: ${parsed.error}.`);
        }

        // Stored as the author entered them (R137): the parse above only validates. Every use
        // (reach, run) parses the stored settings again, so a transform schema keeps working.
        return Result.ok({ ...step, config: { automationId, settings } });
    }

    public async reach() {
        // Task 10: look the definition up, trigger the run task as the requester, `reachRun`.
        return Result.ok();
    }
}

export const AutomationStepType = StepType.createImplementation({
    implementation: AutomationStepTypeImpl,
    dependencies: [AutomationDefinitionRegistryService]
});
