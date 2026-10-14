import "@webiny/background-tasks/api/features/TaskController/augmentation.js";
import {
    TaskHandler,
    type TaskDefinition
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { automationStepConfigSchema } from "~/domain/automation/automationStepConfigSchema.js";
import { getAutomationActor } from "~/domain/automation/getAutomationActor.js";
import { getRequesterIdentity } from "~/domain/automation/getRequesterIdentity.js";
import { parseAutomationSettings } from "~/domain/automation/parseAutomationSettings.js";
import { Review, REJECT_COMMENT_MIN_LENGTH } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewNotFoundError, ReviewTargetSyncError } from "~/domain/review/errors.js";
import { getStaleStepRunReason } from "~/domain/review/getStaleStepRunReason.js";
import type { ReviewStep } from "~/domain/review/types.js";
import { AutomationDefinitionRegistryService } from "~/features/automation/AutomationDefinitionRegistryService/index.js";
import type { AutomationDefinition } from "~/features/automation/AutomationDefinition/index.js";
import { WorkflowBypassService } from "~/features/bypass/WorkflowBypassService/index.js";
import { ApproveReviewStepUseCase } from "~/features/review/ApproveReviewStep/index.js";
import { RejectReviewStepUseCase } from "~/features/review/RejectReviewStep/index.js";
import { ReviewSaver } from "~/features/review/ReviewSaver/abstractions.js";
import {
    DEFAULT_AUTOMATION_MAX_ITERATIONS,
    STEP_RUN_TASKID_WAIT_SECONDS,
    STEP_RUN_TASKID_WAIT_TRIES
} from "../constants.js";
import { StepRunFailure } from "../StepRunFailure.js";
import type { StepRunTaskInput } from "../types.js";

type RunParams = TaskHandler.RunParams<StepRunTaskInput>;
type HookParams = TaskHandler.LifecycleHookParams<StepRunTaskInput>;

/**
 * Runs one automation step (spec 7.4, R142). `run` reads the review, applies the stale guard (a
 * forged, foreign or restarted task writes nothing, R144, R148), waits a few iterations for its
 * task id to appear on the step (R143), runs the automation as the requester inside the bypass
 * (R150, R161) and applies its outcome through the base approve and reject use cases as the
 * automation actor (R141). Every failure fails the step once, with a fixed reason (R146). The
 * failure hooks fail the step when the runner reports an error, the iteration ceiling or an abort.
 * Every write is guarded; a hook never throws.
 */
class WorkflowStepRunTaskHandlerImpl implements TaskHandler.Interface<StepRunTaskInput> {
    public constructor(
        private repository: ReviewRepository.Interface,
        private saver: ReviewSaver.Interface,
        private logger: Logger.Interface,
        private definitions: AutomationDefinitionRegistryService.Interface,
        private approveStep: ApproveReviewStepUseCase.Interface,
        private rejectStep: RejectReviewStepUseCase.Interface,
        private bypass: WorkflowBypassService.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    public async run({ input, controller }: RunParams) {
        const { reviewId, stepId } = input;
        const task = controller.state.getTask();

        // 1. Read and guard. The input is never trusted beyond the two ids (R148).
        const loaded = await this.repository.get(reviewId);
        if (loaded.isFail() && !(loaded.error instanceof ReviewNotFoundError)) {
            this.logger.error(
                { error: loaded.error, taskId: task.id, reviewId, stepId },
                "Could not read the review in a step run."
            );
            return controller.response.error(loaded.error);
        }
        const data = loaded.isOk() ? loaded.value : null;
        const stale = data
            ? getStaleStepRunReason(data, stepId, {
                  id: task.id,
                  createdById: task.createdBy.id
              })
            : "The review was not found.";

        // 2. The trigger runs before the save, so only two cases wait: the review does not exist
        // yet, or it is active and in progress and the step does not carry this task's id yet.
        // Any other guard result ends the task at once (R143, R163).
        if (!data || stale) {
            const step = data ? data.steps.find(item => item.id === stepId) : undefined;
            const taskIdNotSaved =
                !data ||
                (data.isActive &&
                    data.state === "inProgress" &&
                    step !== undefined &&
                    step.taskId !== task.id);
            if (taskIdNotSaved && task.iterations <= STEP_RUN_TASKID_WAIT_TRIES) {
                return controller.response.continue(input, {
                    seconds: STEP_RUN_TASKID_WAIT_SECONDS
                });
            }
            this.logger.info(
                { taskId: task.id, reviewId, stepId, stale },
                "Ignored a stale step run."
            );
            return controller.response.done();
        }
        // The guard passed, so the step exists.
        const step = data.steps.find(item => item.id === stepId) as ReviewStep;

        // Everything from here on acts as the requester (D58, D87, R161). The runner already
        // restored `task.createdBy` (the requester, checked by the guard) and runs the handler
        // under `withoutAuthorization` (D36: an automation may change anything); this makes the
        // identity explicit (attribution only) and does not switch authorization back on, so the
        // requester's permissions are not applied.
        const requester = data.createdBy;
        const identity = getRequesterIdentity(requester);

        return this.identityContext.withIdentity(identity, async () => {
            try {
                // 3. Look up and validate everything from the review snapshot (A53, R148).
                const config = automationStepConfigSchema.safeParse(step.config);
                if (!config.success) {
                    throw new StepRunFailure("The automation step configuration is not valid.");
                }
                const automationId = config.data.automationId;
                const definition = this.definitions.get(automationId);
                if (!definition) {
                    throw new StepRunFailure(`The automation "${automationId}" is not available.`);
                }
                // `iteration` counts automation runs, never the waits for the task id (R163).
                const output = controller.state.getOutput();
                const idWaits =
                    typeof output?.idWaits === "number" ? output.idWaits : task.iterations - 1;
                const iteration = task.iterations - idWaits;
                const maxIterations = definition.maxIterations ?? DEFAULT_AUTOMATION_MAX_ITERATIONS;
                if (iteration > maxIterations) {
                    throw new StepRunFailure(
                        `The automation did not finish in ${maxIterations} iterations.`
                    );
                }
                const settings = parseAutomationSettings(definition, config.data.settings);
                if (settings.isFail()) {
                    throw new StepRunFailure(
                        `The automation settings are not valid: ${settings.error}.`
                    );
                }

                // 4. Run inside the bypass, and only there (D36, R150).
                const state = (output?.state ?? null) as Record<string, unknown> | null;
                let outcome: AutomationDefinition.Outcome;
                try {
                    outcome = await this.bypass.run(() =>
                        definition.run({
                            settings: settings.value,
                            review: data,
                            step,
                            iteration,
                            state
                        })
                    );
                } catch (error) {
                    // The raw message can carry internals: logged, never stored (R146).
                    this.logger.error(
                        { error, taskId: task.id, reviewId, stepId },
                        "The automation threw."
                    );
                    throw new StepRunFailure("The automation failed.");
                }

                // The automation may have run for a while: the review can have been cancelled, or
                // the step aborted and restarted under another task. A stale task writes nothing.
                const after = await this.repository.get(reviewId);
                if (after.isFail()) {
                    this.logger.error(
                        { error: after.error, taskId: task.id, reviewId, stepId },
                        "Could not read the review to apply the automation outcome."
                    );
                    return controller.response.error(after.error);
                }
                const staleAfter = getStaleStepRunReason(after.value, stepId, {
                    id: task.id,
                    createdById: task.createdBy.id
                });
                if (staleAfter) {
                    this.logger.info(
                        { taskId: task.id, reviewId, stepId, stale: staleAfter },
                        "Ignored a stale step run outcome."
                    );
                    return controller.response.done();
                }

                // 5. Apply the outcome as the automation actor (R135, R141).
                switch (outcome.type) {
                    case "approved": {
                        const approved = await this.approveStep.execute({
                            reviewId,
                            stepId,
                            actor: getAutomationActor(requester),
                            actorTeamIds: [],
                            comment: outcome.comment
                        });
                        if (approved.isFail()) {
                            this.logger.error(
                                { error: approved.error, taskId: task.id, reviewId, stepId },
                                "Applying the automation outcome failed."
                            );
                            throw new StepRunFailure("The automation failed.");
                        }
                        return controller.response.done();
                    }
                    case "rejected": {
                        const comment = (outcome.comment ?? "").trim();
                        if (comment.length < REJECT_COMMENT_MIN_LENGTH) {
                            throw new StepRunFailure("The automation rejected without a comment.");
                        }
                        const rejected = await this.rejectStep.execute({
                            reviewId,
                            stepId,
                            actor: getAutomationActor(requester),
                            actorTeamIds: [],
                            comment
                        });
                        if (rejected.isFail()) {
                            this.logger.error(
                                { error: rejected.error, taskId: task.id, reviewId, stepId },
                                "Applying the automation outcome failed."
                            );
                            throw new StepRunFailure("The automation failed.");
                        }
                        return controller.response.done();
                    }
                    case "continue": {
                        // One whole write of what this handler keeps in the task output (R135,
                        // R163): the wait count and the automation's state.
                        await controller.state.updateOutput({
                            idWaits,
                            state: outcome.state !== undefined ? outcome.state : state
                        });
                        return controller.response.continue(
                            input,
                            outcome.wait ? { seconds: outcome.wait } : undefined
                        );
                    }
                    default:
                        throw new StepRunFailure(
                            "The automation failed: It returned an unknown outcome."
                        );
                }
            } catch (error) {
                if (!(error instanceof StepRunFailure)) {
                    return controller.response.error(
                        error instanceof Error ? error : new Error(String(error))
                    );
                }

                // 6. The one failure path (R146, R159): read again, guard again (a review
                // cancelled meanwhile, or whose outcome did get saved, is not touched), fail the
                // step, save. Nothing is ignored silently: every skipped or failed write is logged.
                const current = await this.repository.get(reviewId);
                if (current.isFail()) {
                    this.logger.error(
                        { error: current.error, taskId: task.id, reviewId, stepId },
                        "Could not read the review to fail the step."
                    );
                    return controller.response.error(current.error);
                }
                const staleNow = getStaleStepRunReason(current.value, stepId, {
                    id: task.id,
                    createdById: task.createdBy.id
                });
                if (staleNow) {
                    this.logger.info(
                        {
                            taskId: task.id,
                            reviewId,
                            stepId,
                            stale: staleNow,
                            reason: error.reason
                        },
                        "Ignored a stale step run failure."
                    );
                    return controller.response.done();
                }
                const review = Review.fromData(current.value);
                const failed = review.fail({
                    stepId,
                    reason: error.reason,
                    now: new Date().toISOString()
                });
                if (failed.isFail()) {
                    this.logger.error(
                        { error: failed.error, taskId: task.id, reviewId, stepId },
                        "Could not fail the step after a step run failure."
                    );
                    return controller.response.error(failed.error);
                }
                const saved = await this.saver.save(review);
                if (saved.isFail()) {
                    this.logger.error(
                        { error: saved.error, taskId: task.id, reviewId, stepId },
                        "Could not save the failed step after a step run failure."
                    );
                    // A failed target sync still saved the failed step (R16).
                    if (!(saved.error instanceof ReviewTargetSyncError)) {
                        return controller.response.error(saved.error);
                    }
                }
                return controller.response.done();
            }
        });
    }

    public createInputValidation({ validator }: TaskDefinition.CreateInputValidationParams) {
        return {
            reviewId: validator.string(),
            stepId: validator.string()
        };
    }

    public async onError({ task }: HookParams): Promise<void> {
        // Fixed text only: the task's own error can carry internals (R146).
        const reason = "The automation failed.";

        const { reviewId, stepId }: Partial<StepRunTaskInput> = task.input ?? {};
        if (typeof reviewId !== "string" || typeof stepId !== "string") {
            this.logger.info({ taskId: task.id }, "Ignored a step run hook with a bad input.");
            return;
        }
        try {
            const loaded = await this.repository.get(reviewId);
            if (loaded.isFail()) {
                if (loaded.error instanceof ReviewNotFoundError) {
                    this.logger.info(
                        { taskId: task.id, reviewId },
                        "Ignored a step run hook: no review."
                    );
                    return;
                }
                this.logger.error(
                    { error: loaded.error, taskId: task.id, reviewId },
                    "Could not read the review in a step run hook."
                );
                return;
            }
            const stale = getStaleStepRunReason(loaded.value, stepId, {
                id: task.id,
                createdById: task.createdBy.id
            });
            if (stale) {
                this.logger.info(
                    { taskId: task.id, reviewId, stepId, stale },
                    "Ignored a stale step run hook."
                );
                return;
            }
            // The guard passed, so this task is the step's current task: log its error here (never
            // stored in the step).
            this.logger.error(
                { error: task.output?.error, taskId: task.id, reviewId, stepId },
                "The step run task ended with an error."
            );
            const review = Review.fromData(loaded.value);
            const failed = review.fail({ stepId, reason, now: new Date().toISOString() });
            if (failed.isFail()) {
                this.logger.error(
                    { error: failed.error, taskId: task.id, reviewId, stepId },
                    "Could not fail the step after a step run error."
                );
                return;
            }
            const saved = await this.saver.save(review);
            if (saved.isFail()) {
                this.logger.error(
                    { error: saved.error, taskId: task.id, reviewId, stepId },
                    "Could not save the failed step after a step run error."
                );
            }
        } catch (error) {
            this.logger.error(
                { error, taskId: task.id, reviewId, stepId },
                "A step run error hook threw."
            );
        }
    }

    public async onMaxIterations({ task }: HookParams): Promise<void> {
        const { reviewId, stepId }: Partial<StepRunTaskInput> = task.input ?? {};
        if (typeof reviewId !== "string" || typeof stepId !== "string") {
            this.logger.info({ taskId: task.id }, "Ignored a step run hook with a bad input.");
            return;
        }
        try {
            const loaded = await this.repository.get(reviewId);
            if (loaded.isFail()) {
                if (loaded.error instanceof ReviewNotFoundError) {
                    this.logger.info(
                        { taskId: task.id, reviewId },
                        "Ignored a step run hook: no review."
                    );
                    return;
                }
                this.logger.error(
                    { error: loaded.error, taskId: task.id, reviewId },
                    "Could not read the review in a step run hook."
                );
                return;
            }
            const stale = getStaleStepRunReason(loaded.value, stepId, {
                id: task.id,
                createdById: task.createdBy.id
            });
            if (stale) {
                this.logger.info(
                    { taskId: task.id, reviewId, stepId, stale },
                    "Ignored a stale step run hook."
                );
                return;
            }
            // The reason names the automation's own limit from the review snapshot, never the
            // 10000 ceiling of the task definition (R145, P4).
            const step = loaded.value.steps.find(item => item.id === stepId);
            const config = automationStepConfigSchema.safeParse(step?.config);
            const own = config.success ? this.definitions.get(config.data.automationId) : null;
            const maxIterations = own?.maxIterations ?? DEFAULT_AUTOMATION_MAX_ITERATIONS;
            const reason = `The automation did not finish in ${maxIterations} iterations.`;
            const review = Review.fromData(loaded.value);
            const failed = review.fail({ stepId, reason, now: new Date().toISOString() });
            if (failed.isFail()) {
                this.logger.error(
                    { error: failed.error, taskId: task.id, reviewId, stepId },
                    "Could not fail the step at the iteration ceiling."
                );
                return;
            }
            const saved = await this.saver.save(review);
            if (saved.isFail()) {
                this.logger.error(
                    { error: saved.error, taskId: task.id, reviewId, stepId },
                    "Could not save the failed step at the iteration ceiling."
                );
            }
        } catch (error) {
            this.logger.error(
                { error, taskId: task.id, reviewId, stepId },
                "A step run max iterations hook threw."
            );
        }
    }

    public async onAbort({ task }: HookParams): Promise<void> {
        const reason = "The automation was aborted.";

        const { reviewId, stepId }: Partial<StepRunTaskInput> = task.input ?? {};
        if (typeof reviewId !== "string" || typeof stepId !== "string") {
            this.logger.info({ taskId: task.id }, "Ignored a step run hook with a bad input.");
            return;
        }
        try {
            const loaded = await this.repository.get(reviewId);
            if (loaded.isFail()) {
                if (loaded.error instanceof ReviewNotFoundError) {
                    this.logger.info(
                        { taskId: task.id, reviewId },
                        "Ignored a step run hook: no review."
                    );
                    return;
                }
                this.logger.error(
                    { error: loaded.error, taskId: task.id, reviewId },
                    "Could not read the review in a step run hook."
                );
                return;
            }
            const stale = getStaleStepRunReason(loaded.value, stepId, {
                id: task.id,
                createdById: task.createdBy.id
            });
            if (stale) {
                this.logger.info(
                    { taskId: task.id, reviewId, stepId, stale },
                    "Ignored a stale step run hook."
                );
                return;
            }
            const review = Review.fromData(loaded.value);
            const failed = review.fail({ stepId, reason, now: new Date().toISOString() });
            if (failed.isFail()) {
                this.logger.error(
                    { error: failed.error, taskId: task.id, reviewId, stepId },
                    "Could not fail the step after a step run abort."
                );
                return;
            }
            const saved = await this.saver.save(review);
            if (saved.isFail()) {
                this.logger.error(
                    { error: saved.error, taskId: task.id, reviewId, stepId },
                    "Could not save the failed step after a step run abort."
                );
            }
        } catch (error) {
            this.logger.error(
                { error, taskId: task.id, reviewId, stepId },
                "A step run abort hook threw."
            );
        }
    }
}

export const WorkflowStepRunTaskHandler = TaskHandler.createImplementation({
    implementation: WorkflowStepRunTaskHandlerImpl,
    dependencies: [
        ReviewRepository,
        ReviewSaver,
        Logger,
        AutomationDefinitionRegistryService,
        ApproveReviewStepUseCase,
        RejectReviewStepUseCase,
        WorkflowBypassService,
        IdentityContext
    ]
});
