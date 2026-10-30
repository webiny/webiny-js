import { Result } from "@webiny/feature/api";
import { getAutomationActor } from "~/domain/automation/getAutomationActor.js";
import { StepRunReachService } from "~/features/stepRun/StepRunReachService/index.js";
import { WorkflowValidationError } from "~/domain/workflow/errors.js";
import { AUTOMATION_STEP_TYPE } from "~/domain/workflow/stepTypes.js";
import { automationStepConfigSchema } from "~/domain/automation/automationStepConfigSchema.js";
import { matchesAutomationScope } from "~/domain/automation/matchesAutomationScope.js";
import { parseAutomationSettings } from "~/domain/automation/parseAutomationSettings.js";
import { parseAutomationSettingsIssue } from "~/domain/automation/parseAutomationSettingsIssue.js";
import { AutomationDefinitionRegistryService } from "~/features/automation/AutomationDefinitionRegistryService/abstractions.js";
import { StepType } from "~/features/stepTypes/StepType/abstractions.js";

const fail = (message: string, stepId: string, field: string) => {
    return Result.fail(new WorkflowValidationError(message, { stepId, field }));
};

/**
 * The built-in automation step (spec 7.2, R133): runs a developer-written `AutomationDefinition`
 * chosen by `config.automationId`. Save-time validation checks the definition exists, covers the
 * workflow's models and accepts the settings (D35, D37, R137). `reach` checks the same things
 * again and hands the trigger to `StepRunReachService` (R149, R168).
 */
class AutomationStepTypeImpl implements StepType.Interface {
    public readonly type = AUTOMATION_STEP_TYPE;
    public readonly title = "Automation";
    public readonly configSchema = automationStepConfigSchema;

    public constructor(
        private definitions: AutomationDefinitionRegistryService.Interface,
        private stepRunReach: StepRunReachService.Interface
    ) {}

    public async describeAvailability(): Promise<StepType.Availability> {
        if (this.definitions.list().length === 0) {
            return { available: false, unavailableReason: "No automation is defined." };
        }
        return { available: true, unavailableReason: null };
    }

    public validate({ step, workflow }: StepType.ValidateParams) {
        const shell = automationStepConfigSchema.safeParse(step.config);
        if (!shell.success) {
            return fail(
                `Step "${step.title}" needs an automation.`,
                step.id,
                "config.automationId"
            );
        }
        const { automationId, settings } = shell.data;

        const definition = this.definitions.get(automationId);
        if (!definition) {
            return fail(
                `Step "${step.title}" uses the automation "${automationId}", which is not defined.`,
                step.id,
                "config.automationId"
            );
        }
        if (!matchesAutomationScope(definition.models, workflow.models)) {
            return fail(
                `Automation "${automationId}" is not available for this workflow's models.`,
                step.id,
                "config.automationId"
            );
        }

        const parsed = parseAutomationSettingsIssue(definition.settingsSchema, settings);
        if (parsed.isFail()) {
            const { path, message } = parsed.error;
            const detail = path ? `${path}: ${message}` : message;
            const field = path ? `config.settings.${path}` : "config.settings";
            return fail(`Step "${step.title}" settings are not valid: ${detail}.`, step.id, field);
        }

        // Stored as the author entered them (R137): the parse above only validates. Every use
        // (reach, run) parses the stored settings again, so a transform schema keeps working.
        return Result.ok({ ...step, config: { automationId, settings } });
    }

    public async reach({ review, step, actor, now }: StepType.ReachParams) {
        const data = review.toData();

        // Everything that can stop the step from running is checked here, in this order, and ends
        // in a fixed reason (R146). The same checks run again before every run (R148).
        let failure: string | null = null;
        const config = automationStepConfigSchema.safeParse(step.config);
        if (!config.success) {
            // A config that no longer parses has its own reason (P3), not the missing-definition one.
            failure = "The automation step configuration is not valid.";
        } else {
            const automationId = config.data.automationId;
            const definition = this.definitions.get(automationId);
            if (!definition) {
                failure = `The automation "${automationId}" is not available.`;
            } else if (!matchesAutomationScope(definition.models, data.workflow.models)) {
                failure = `The automation "${automationId}" is not available for this workflow's models.`;
            } else {
                const settings = parseAutomationSettings(
                    definition.settingsSchema,
                    config.data.settings
                );
                if (settings.isFail()) {
                    failure = `The automation settings are not valid: ${settings.error}.`;
                }
            }
        }

        // Trigger as the requester, reach, abort and fail are the shared reach path (R168).
        return this.stepRunReach.reach({
            review,
            step,
            actor,
            owner: getAutomationActor(data.createdBy),
            now,
            failure,
            startFailure: "The automation could not be started."
        });
    }
}

export const AutomationStepType = StepType.createImplementation({
    implementation: AutomationStepTypeImpl,
    dependencies: [AutomationDefinitionRegistryService, StepRunReachService]
});
