import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { getAutomationActor } from "~/domain/automation/getAutomationActor.js";
import { getRequesterIdentity } from "~/domain/automation/getRequesterIdentity.js";
import { STEP_RUN_TASK_DEFINITION_ID } from "~/features/stepRun/constants.js";
import type { StepRunTaskInput } from "~/features/stepRun/types.js";
import { ReviewTaskAbortService } from "~/features/stepRun/ReviewTaskAbortService/index.js";
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
 * workflow's models and accepts the settings (D35, D37, R137). `reach` triggers the run task as
 * the requester (R149).
 */
class AutomationStepTypeImpl implements StepType.Interface {
    public readonly type = AUTOMATION_STEP_TYPE;
    public readonly title = "Automation";
    public readonly configSchema = automationStepConfigSchema;

    public constructor(
        private definitions: AutomationDefinitionRegistryService.Interface,
        private taskService: TaskService.Interface,
        private identityContext: IdentityContext.Interface,
        private taskAbort: ReviewTaskAbortService.Interface,
        private logger: Logger.Interface
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

    public async reach({ review, step, actor, now }: StepType.ReachParams) {
        const data = review.toData();
        const requester = data.createdBy;
        const owner = getAutomationActor(requester);

        // Everything that can stop the step from running is checked here, in this order, and ends
        // in a fixed reason (R146). The same checks run again before every run (R148).
        let reason: string | null = null;
        const config = automationStepConfigSchema.safeParse(step.config);
        if (!config.success) {
            // A config that no longer parses has its own reason (P3), not the missing-definition one.
            reason = "The automation step configuration is not valid.";
        } else {
            const automationId = config.data.automationId;
            const definition = this.definitions.get(automationId);
            if (!definition) {
                reason = `The automation "${automationId}" is not available.`;
            } else if (!matchesAutomationScope(definition.models, data.workflow.models)) {
                reason = `The automation "${automationId}" is not available for this workflow's models.`;
            } else {
                const settings = parseAutomationSettings(definition, config.data.settings);
                if (settings.isFail()) {
                    reason = `The automation settings are not valid: ${settings.error}.`;
                }
            }
        }

        // The trigger runs as the requester, never as `actor` (the approver of the previous step,
        // the restarter or the task itself): the task's `createdBy` must be the requester, which
        // the run handler checks (R148, R149). `TaskService.trigger` is unchanged; the identity
        // is switched for this call only and restored by `withIdentity`.
        let taskId: string | null = null;
        if (reason === null) {
            const input: StepRunTaskInput = { reviewId: data.id, stepId: step.id };
            const identity = getRequesterIdentity(requester);
            try {
                const triggered = await this.identityContext.withIdentity(identity, () => {
                    return this.taskService.trigger({
                        definition: STEP_RUN_TASK_DEFINITION_ID,
                        name: `Workflow step: ${step.title}`,
                        input
                    });
                });
                if (triggered.isFail()) {
                    // The raw message can carry internals: logged, never stored (R146).
                    this.logger.error(
                        { error: triggered.error, reviewId: data.id, stepId: step.id },
                        "Could not start the automation task."
                    );
                    reason = "The automation could not be started.";
                } else {
                    taskId = triggered.value.id;
                }
            } catch (error) {
                this.logger.error(
                    { error, reviewId: data.id, stepId: step.id },
                    "Could not start the automation task."
                );
                reason = "The automation could not be started.";
            }
        }

        // The task id is stored by the one save. If the step cannot be reached after a successful
        // trigger, nothing will ever carry that id, so the task is aborted here.
        const reached = review.reachRun({ actor, owner, taskId, now });
        if (reached.isFail()) {
            if (taskId !== null) {
                await this.taskAbort.abort({
                    taskIds: [taskId],
                    message: "The review could not be saved."
                });
            }
            return Result.fail(reached.error);
        }
        if (reason === null) {
            return Result.ok();
        }

        // No task exists: record the reach without one, then fail the step with the reason. The
        // step stays restartable (D8); the use case saves the failed review as usual.
        const failed = review.fail({ stepId: step.id, reason, now });
        // Whatever `fail` returns is returned, never ignored (R159).
        if (failed.isFail()) {
            return Result.fail(failed.error);
        }
        return Result.ok();
    }
}

export const AutomationStepType = StepType.createImplementation({
    implementation: AutomationStepTypeImpl,
    dependencies: [
        AutomationDefinitionRegistryService,
        TaskService,
        IdentityContext,
        ReviewTaskAbortService,
        Logger
    ]
});
