import { Logger } from "@webiny/api-core/features/logger/index.js";
import { automationStepConfigSchema } from "~/domain/automation/automationStepConfigSchema.js";
import { getAutomationActor } from "~/domain/automation/getAutomationActor.js";
import { parseAutomationSettings } from "~/domain/automation/parseAutomationSettings.js";
import { REJECT_COMMENT_MIN_LENGTH } from "~/domain/review/Review.js";
import type { Actor, ReviewStep } from "~/domain/review/types.js";
import { AUTOMATION_STEP_TYPE } from "~/domain/workflow/stepTypes.js";
import type { AutomationDefinition } from "~/features/automation/AutomationDefinition/index.js";
import { AutomationDefinitionRegistryService } from "~/features/automation/AutomationDefinitionRegistryService/index.js";
import { WorkflowBypassService } from "~/features/bypass/WorkflowBypassService/index.js";
import { DEFAULT_AUTOMATION_MAX_ITERATIONS } from "~/features/stepRun/constants.js";
import { StepRunFailure } from "~/features/stepRun/StepRunFailure.js";
import { StepRunner } from "~/features/stepRun/StepRunner/abstractions.js";

/**
 * Runs an automation step (spec 7.4, R142): the logic the phase 5 handler held, moved here
 * unchanged (R168). Looks up and validates everything from the review snapshot (A53, R148),
 * then runs the developer's definition inside the bypass and only there (D36, R150). It ignores
 * `signal` (R175) and is never `singleRun`: an automation may continue (R135).
 */
class AutomationStepRunnerImpl implements StepRunner.Interface {
    public readonly type = AUTOMATION_STEP_TYPE;
    public readonly singleRun = false;
    public readonly failureReasons: StepRunner.FailureReasons = {
        error: "The automation failed.",
        aborted: "The automation was aborted.",
        stuck: "The automation task ended without a result."
    };

    public constructor(
        private definitions: AutomationDefinitionRegistryService.Interface,
        private bypass: WorkflowBypassService.Interface,
        private logger: Logger.Interface
    ) {}

    public maxIterationsReason(step: ReviewStep): string {
        // The reason names the automation's own limit from the review snapshot, never the
        // 10000 ceiling of the task definition (R145, P4).
        const config = automationStepConfigSchema.safeParse(step.config);
        const own = config.success ? this.definitions.get(config.data.automationId) : null;
        const maxIterations = own?.maxIterations ?? DEFAULT_AUTOMATION_MAX_ITERATIONS;
        return `The automation did not finish in ${maxIterations} iterations.`;
    }

    public getActor(requester: Actor): Actor {
        return getAutomationActor(requester);
    }

    public async run({
        review,
        step,
        task,
        iteration,
        state
    }: StepRunner.Params): Promise<StepRunner.Outcome> {
        const config = automationStepConfigSchema.safeParse(step.config);
        if (!config.success) {
            throw new StepRunFailure("The automation step configuration is not valid.");
        }
        const automationId = config.data.automationId;
        const definition = this.definitions.get(automationId);
        if (!definition) {
            throw new StepRunFailure(`The automation "${automationId}" is not available.`);
        }
        const maxIterations = definition.maxIterations ?? DEFAULT_AUTOMATION_MAX_ITERATIONS;
        if (iteration > maxIterations) {
            throw new StepRunFailure(
                `The automation did not finish in ${maxIterations} iterations.`
            );
        }
        const settings = parseAutomationSettings(definition, config.data.settings);
        if (settings.isFail()) {
            throw new StepRunFailure(`The automation settings are not valid: ${settings.error}.`);
        }

        // Run inside the bypass, and only there (D36, R150).
        let outcome: AutomationDefinition.Outcome;
        try {
            outcome = await this.bypass.run(() =>
                definition.run({
                    settings: settings.value,
                    review,
                    step,
                    iteration,
                    state
                })
            );
        } catch (error) {
            // The raw message can carry internals: logged, never stored (R146).
            this.logger.error(
                { err: error, taskId: task.id, reviewId: review.id, stepId: step.id },
                "The automation threw."
            );
            throw new StepRunFailure("The automation failed.");
        }

        switch (outcome.type) {
            case "approved":
                return { type: "approved", comment: outcome.comment };
            case "rejected": {
                const comment = (outcome.comment ?? "").trim();
                if (comment.length < REJECT_COMMENT_MIN_LENGTH) {
                    throw new StepRunFailure("The automation rejected without a comment.");
                }
                return { type: "rejected", comment };
            }
            case "continue":
                return outcome;
            default:
                throw new StepRunFailure("The automation failed: It returned an unknown outcome.");
        }
    }
}

export const AutomationStepRunner = StepRunner.createImplementation({
    implementation: AutomationStepRunnerImpl,
    dependencies: [AutomationDefinitionRegistryService, WorkflowBypassService, Logger]
});
