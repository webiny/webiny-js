import { Result } from "@webiny/feature/api";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { StepType } from "@webiny/api-workflows/features/stepTypes/StepType/index.js";
import { StepRunReachService } from "@webiny/api-workflows/features/stepRun/StepRunReachService/index.js";
import { WorkflowAiToolRegistryService } from "@webiny/api-workflows/features/aiTools/WorkflowAiToolRegistryService/index.js";
import { WorkflowValidationError } from "@webiny/api-workflows/domain/workflow/errors.js";
import { getConfigIssueField } from "@webiny/api-workflows/domain/workflow/getConfigIssueField.js";
import { AI_STEP_TYPE } from "@webiny/api-workflows/domain/workflow/stepTypes.js";
import { getAiActor } from "@webiny/api-workflows/domain/ai/getAiActor.js";
import {
    AiCapabilityDisabledError,
    AiModelNotAvailableError,
    ResolveAiCapabilityUseCase
} from "~/api/features/Capabilities/index.js";
import { ConfiguredAiModelsService } from "~/api/features/ConfiguredAiModels/index.js";
import { WORKFLOWS_REVIEW_CAPABILITY_ID } from "../constants.js";
import { aiStepConfigSchema } from "../aiStepConfigSchema.js";
import { toLoggedAiError } from "../toLoggedAiError.js";
import {
    AI_CAPABILITY_NOT_AVAILABLE_REASON,
    AI_REVIEW_FAILED_REASON,
    AI_REVIEW_NOT_STARTED_REASON,
    AI_STEP_INVALID_CONFIGURATION_REASON,
    aiModelNotAvailableReason,
    aiToolNotAvailableReason
} from "../aiFailureReasons.js";

const fail = (message: string, stepId: string, field: string) => {
    return Result.fail(new WorkflowValidationError(message, { stepId, field }));
};

/**
 * The `ai` step (spec 7.3, R164): the author writes the instructions, picks a model that has a
 * configured connection (D101) and allowlists registered tools. Save-time validation is pure
 * (R165); the model check is the async `checkConfig` hook, which the store runs only for a new or
 * changed step. `reach` mirrors the automation step: every reason that stops the step from running
 * is a fixed text (R170) and the shared `StepRunReachService` does the triggering.
 *
 * Registered by `Extension.ts` together with `AiStepRunner`, last, only when `aiPowerups` and
 * `advancedPublishingWorkflow` are both on (R177, R178).
 */
class AiStepTypeImpl implements StepType.Interface {
    public readonly type = AI_STEP_TYPE;
    public readonly title = "AI";
    public readonly configSchema = aiStepConfigSchema;

    public constructor(
        private tools: WorkflowAiToolRegistryService.Interface,
        private models: ConfiguredAiModelsService.Interface,
        private capabilities: ResolveAiCapabilityUseCase.Interface,
        private reachService: StepRunReachService.Interface,
        private logger: Logger.Interface
    ) {}

    public async describeAvailability(): Promise<StepType.Availability> {
        return { available: true, unavailableReason: null };
    }

    public validate({ step }: StepType.ValidateParams) {
        const raw =
            typeof step.config === "object" && step.config !== null
                ? (step.config as Record<string, unknown>)
                : {};

        const instructions = raw.instructions;
        if (typeof instructions !== "string" || instructions.trim() === "") {
            return fail(`Step "${step.title}" needs instructions.`, step.id, "config.instructions");
        }

        const model = typeof raw.model === "string" ? raw.model.trim() : "";
        if (model === "") {
            return fail(`Step "${step.title}" needs a model.`, step.id, "config.model");
        }

        const given = raw.tools ?? [];
        if (!Array.isArray(given) || given.some(name => typeof name !== "string")) {
            return fail(
                `Step "${step.title}" has an invalid AI configuration.`,
                step.id,
                "config.tools"
            );
        }
        // A duplicate is not an error: first-seen order, one entry each.
        const tools: string[] = [...new Set<string>(given)];
        for (const name of tools) {
            if (this.tools.get(name) === null) {
                return fail(
                    `Step "${step.title}" uses the AI tool "${name}", which is not defined.`,
                    step.id,
                    "config.tools"
                );
            }
        }

        // Stored as entered (R165): instructions untouched, model trimmed, tools deduplicated.
        return Result.ok({ ...step, config: { instructions, model, tools } });
    }

    public async checkConfig({
        step
    }: StepType.ValidateParams): Promise<Result<void, WorkflowValidationError>> {
        const config = aiStepConfigSchema.safeParse(step.config);
        if (!config.success) {
            const [issue] = config.error.issues;
            const field = getConfigIssueField(issue?.path ?? []);
            return fail(`Step "${step.title}" has an invalid AI configuration.`, step.id, field);
        }

        // `list()` logs its own failure once, with the raw error, and returns a failed Result with
        // a fixed text. This check shows its own fixed text and does not log it again.
        const listed = await this.models.list();
        if (listed.isFail()) {
            return fail(
                `Step "${step.title}" could not be checked: the configured AI models could not be loaded.`,
                step.id,
                "config.model"
            );
        }
        if (!listed.value.some(model => model.id === config.data.model)) {
            return fail(
                `Step "${step.title}" uses the model "${config.data.model}", which is not available.`,
                step.id,
                "config.model"
            );
        }
        return Result.ok();
    }

    public async reach({ review, step, actor, now }: StepType.ReachParams) {
        const data = review.toData();
        const requester = data.createdBy;

        // Everything that can stop the step from running is checked here, in this order, and ends
        // in a fixed reason (R170). The same checks run again before every run.
        let failure: string | null = null;
        const config = aiStepConfigSchema.safeParse(step.config);
        if (!config.success) {
            failure = AI_STEP_INVALID_CONFIGURATION_REASON;
        } else {
            const missing = config.data.tools.find(name => this.tools.get(name) === null);
            if (missing !== undefined) {
                failure = aiToolNotAvailableReason(missing);
            } else {
                try {
                    // Reach resolves the capability (this decrypts the key) only to validate that
                    // the step is usable; the resolution is not passed on, the runner resolves
                    // again when it starts.
                    const resolved = await this.capabilities.execute(
                        WORKFLOWS_REVIEW_CAPABILITY_ID,
                        config.data.model
                    );
                    if (resolved.isFail()) {
                        if (resolved.error instanceof AiModelNotAvailableError) {
                            failure = aiModelNotAvailableReason(config.data.model);
                        } else {
                            failure = AI_CAPABILITY_NOT_AVAILABLE_REASON;
                            // A switched-off capability is a decision, not a problem (D40): not
                            // logged. Any other failure is logged; the raw text is never stored.
                            if (!(resolved.error instanceof AiCapabilityDisabledError)) {
                                this.logger.error(
                                    {
                                        error: toLoggedAiError(resolved.error),
                                        reviewId: data.id,
                                        stepId: step.id
                                    },
                                    "Could not resolve the AI review capability."
                                );
                            }
                        }
                    }
                } catch (error) {
                    this.logger.error(
                        { error: toLoggedAiError(error), reviewId: data.id, stepId: step.id },
                        "Could not resolve the AI review capability."
                    );
                    failure = AI_REVIEW_FAILED_REASON;
                }
            }
        }

        // The shared service triggers the task as the requester (or fails the step with `failure`
        // when it is set), stores the task id in the one save and aborts the task when that save
        // cannot happen. Whatever it returns is returned, never ignored (R159).
        return this.reachService.reach({
            review,
            step,
            actor,
            owner: getAiActor(requester),
            now,
            failure,
            startFailure: AI_REVIEW_NOT_STARTED_REASON
        });
    }
}

export const AiStepType = StepType.createImplementation({
    implementation: AiStepTypeImpl,
    dependencies: [
        WorkflowAiToolRegistryService,
        ConfiguredAiModelsService,
        ResolveAiCapabilityUseCase,
        StepRunReachService,
        Logger
    ]
});
