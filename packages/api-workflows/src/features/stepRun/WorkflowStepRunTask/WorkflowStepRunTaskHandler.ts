import "@webiny/background-tasks/api/features/TaskController/augmentation.js";
import {
    TaskHandler,
    type TaskDefinition
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { getRequesterIdentity } from "~/domain/automation/getRequesterIdentity.js";
import { Review, REJECT_COMMENT_MIN_LENGTH } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewNotFoundError, ReviewTargetSyncError } from "~/domain/review/errors.js";
import { getStaleStepRunReason } from "~/domain/review/getStaleStepRunReason.js";
import type { ReviewStep } from "~/domain/review/types.js";
import { ApproveReviewStepUseCase } from "~/features/review/ApproveReviewStep/index.js";
import { RejectReviewStepUseCase } from "~/features/review/RejectReviewStep/index.js";
import { ReviewSaver } from "~/features/review/ReviewSaver/abstractions.js";
import {
    STEP_RUN_MIN_TIMEOUT_MS,
    STEP_RUN_NEUTRAL_ABORTED_REASON,
    STEP_RUN_NEUTRAL_FAILED_REASON,
    STEP_RUN_TASKID_WAIT_SECONDS,
    STEP_RUN_TASKID_WAIT_TRIES,
    STEP_RUN_TIMEOUT_MARGIN_MS
} from "../constants.js";
import { StepRunFailure } from "../StepRunFailure.js";
import type { StepRunner } from "../StepRunner/index.js";
import { StepRunnerRegistryService } from "../StepRunnerRegistryService/index.js";
import type { StepRunTaskInput } from "../types.js";
import { hasErrorSource } from "~/domain/hasErrorSource.js";

type RunParams = TaskHandler.RunParams<StepRunTaskInput>;
type HookParams = TaskHandler.LifecycleHookParams<StepRunTaskInput>;

/**
 * Runs one step of any type (spec 7.4, R142, R168). `run` reads the review, applies the stale
 * guard (a forged, foreign or restarted task writes nothing, R144, R148), waits a few iterations
 * for its task id to appear on the step (R143), hands the step to the `StepRunner` registered for
 * its type, which runs as the requester (R150, R161), and applies the runner's outcome through
 * the base approve and reject use cases as the runner's actor (R141). Every failure fails the
 * step once, with a fixed reason (R146). The failure hooks fail the step when the runner reports
 * an error, the iteration ceiling or an abort. Every write is guarded; a hook never throws.
 */
class WorkflowStepRunTaskHandlerImpl implements TaskHandler.Interface<StepRunTaskInput> {
    public constructor(
        private repository: ReviewRepository.Interface,
        private saver: ReviewSaver.Interface,
        private logger: Logger.Interface,
        private runners: StepRunnerRegistryService.Interface,
        private approveStep: ApproveReviewStepUseCase.Interface,
        private rejectStep: RejectReviewStepUseCase.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    public async run({ input, controller }: RunParams) {
        const { reviewId, stepId } = input;
        const task = controller.state.getTask();

        // 1. Read and guard. The input is never trusted beyond the two ids (R148).
        const loaded = await this.repository.get(reviewId);
        if (loaded.isFail() && !(loaded.error instanceof ReviewNotFoundError)) {
            this.logger.error(
                {
                    err: hasErrorSource(loaded.error) ? loaded.error.source : loaded.error,
                    taskId: task.id,
                    reviewId,
                    stepId
                },
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
                // 3. Pick the runner from the review snapshot (A53, R148, R168).
                const runner = this.runners.get(step.type);
                if (!runner) {
                    throw new StepRunFailure(`The step type "${step.type}" is not available.`);
                }
                // `iteration` counts runs, never the waits for the task id (R163).
                const output = controller.state.getOutput();
                const idWaits =
                    typeof output?.idWaits === "number" ? output.idWaits : task.iterations - 1;
                const iteration = task.iterations - idWaits;
                const state = (output?.state ?? null) as Record<string, unknown> | null;

                // 4. A single-run runner never continues, so the handler fixes the wait count
                // before the model (or any one-shot work) runs: a task that is invoked again
                // reads the stored `idWaits` and gets a real `iteration` of 2, which is refused
                // without calling the runner (R170, R175). A runner that may continue (automation)
                // gets no such write: its output is written only on `continue`.
                if (runner.singleRun) {
                    if (iteration > 1) {
                        throw new StepRunFailure(runner.failureReasons.error);
                    }
                    await controller.state.updateOutput({ idWaits, state });
                }

                // The signal fires near the end of the task's remaining runtime; under the
                // floor it fires at once. The id-wait iterations returned before this point (R175).
                const timeout = new AbortController();
                const budget =
                    controller.runtime.getRemainingMilliseconds() - STEP_RUN_TIMEOUT_MARGIN_MS;
                let timer: ReturnType<typeof setTimeout> | undefined;
                if (budget < STEP_RUN_MIN_TIMEOUT_MS) {
                    timeout.abort();
                } else {
                    timer = setTimeout(() => timeout.abort(), budget);
                }

                // 5. Run the step. The runner validates its own config and owns its own
                // dependencies and texts; a failure is a thrown `StepRunFailure` (R146).
                let outcome: StepRunner.Outcome;
                try {
                    outcome = await runner.run({
                        review: data,
                        step,
                        requester,
                        task: { id: task.id, createdById: task.createdBy.id },
                        iteration,
                        state,
                        signal: timeout.signal
                    });
                } finally {
                    clearTimeout(timer);
                }

                // The runner may have run for a while: the review can have been cancelled, or
                // the step aborted and restarted under another task. A stale task writes nothing.
                const after = await this.repository.get(reviewId);
                if (after.isFail()) {
                    this.logger.error(
                        {
                            err: hasErrorSource(after.error) ? after.error.source : after.error,
                            taskId: task.id,
                            reviewId,
                            stepId
                        },
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

                // 6. Apply the outcome as the runner's actor (R135, R141, R168).
                switch (outcome.type) {
                    case "approved": {
                        const approved = await this.approveStep.execute({
                            reviewId,
                            stepId,
                            actor: runner.getActor(requester),
                            actorTeamIds: [],
                            comment: outcome.comment,
                            issues: outcome.issues
                        });
                        if (approved.isFail()) {
                            this.logger.error(
                                {
                                    err: hasErrorSource(approved.error)
                                        ? approved.error.source
                                        : approved.error,
                                    taskId: task.id,
                                    reviewId,
                                    stepId
                                },
                                "Applying the automation outcome failed."
                            );
                            throw new StepRunFailure(runner.failureReasons.error);
                        }
                        return controller.response.done();
                    }
                    case "rejected": {
                        const comment = (outcome.comment ?? "").trim();
                        if (comment.length < REJECT_COMMENT_MIN_LENGTH) {
                            throw new StepRunFailure(runner.failureReasons.error);
                        }
                        const rejected = await this.rejectStep.execute({
                            reviewId,
                            stepId,
                            actor: runner.getActor(requester),
                            actorTeamIds: [],
                            comment,
                            issues: outcome.issues
                        });
                        if (rejected.isFail()) {
                            this.logger.error(
                                {
                                    err: hasErrorSource(rejected.error)
                                        ? rejected.error.source
                                        : rejected.error,
                                    taskId: task.id,
                                    reviewId,
                                    stepId
                                },
                                "Applying the automation outcome failed."
                            );
                            throw new StepRunFailure(runner.failureReasons.error);
                        }
                        return controller.response.done();
                    }
                    case "continue": {
                        // One whole write of what this handler keeps in the task output (R135,
                        // R163): the wait count and the runner's state.
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
                        throw new StepRunFailure(runner.failureReasons.error);
                }
            } catch (error) {
                if (!(error instanceof StepRunFailure)) {
                    return controller.response.error(
                        error instanceof Error ? error : new Error(String(error))
                    );
                }

                // 7. The one failure path (R146, R159): read again, guard again (a review
                // cancelled meanwhile, or whose outcome did get saved, is not touched), fail the
                // step, save. Nothing is ignored silently: every skipped or failed write is logged.
                const current = await this.repository.get(reviewId);
                if (current.isFail()) {
                    this.logger.error(
                        {
                            err: hasErrorSource(current.error)
                                ? current.error.source
                                : current.error,
                            taskId: task.id,
                            reviewId,
                            stepId
                        },
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
                        {
                            err: hasErrorSource(failed.error) ? failed.error.source : failed.error,
                            taskId: task.id,
                            reviewId,
                            stepId
                        },
                        "Could not fail the step after a step run failure."
                    );
                    return controller.response.error(failed.error);
                }
                const saved = await this.saver.save(review);
                if (saved.isFail()) {
                    this.logger.error(
                        {
                            err: hasErrorSource(saved.error) ? saved.error.source : saved.error,
                            taskId: task.id,
                            reviewId,
                            stepId
                        },
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
                    {
                        err: hasErrorSource(loaded.error) ? loaded.error.source : loaded.error,
                        taskId: task.id,
                        reviewId
                    },
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
            // Fixed text only: the task's own error can carry internals (R146). The runner of the
            // step's type names it; a type with no runner gets the neutral text (R168).
            const step = loaded.value.steps.find(item => item.id === stepId);
            const runner = step ? this.runners.get(step.type) : null;
            const reason = runner ? runner.failureReasons.error : STEP_RUN_NEUTRAL_FAILED_REASON;
            const review = Review.fromData(loaded.value);
            const failed = review.fail({ stepId, reason, now: new Date().toISOString() });
            if (failed.isFail()) {
                this.logger.error(
                    {
                        err: hasErrorSource(failed.error) ? failed.error.source : failed.error,
                        taskId: task.id,
                        reviewId,
                        stepId
                    },
                    "Could not fail the step after a step run error."
                );
                return;
            }
            const saved = await this.saver.save(review);
            if (saved.isFail()) {
                this.logger.error(
                    {
                        err: hasErrorSource(saved.error) ? saved.error.source : saved.error,
                        taskId: task.id,
                        reviewId,
                        stepId
                    },
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
                    {
                        err: hasErrorSource(loaded.error) ? loaded.error.source : loaded.error,
                        taskId: task.id,
                        reviewId
                    },
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
            // The reason names the step type's own limit from the review snapshot, never the
            // 10000 ceiling of the task definition (R145, P4); a type with no runner gets the
            // neutral text (R168). The guard passed, so the step exists.
            const step = loaded.value.steps.find(item => item.id === stepId) as ReviewStep;
            const runner = this.runners.get(step.type);
            const reason = runner
                ? runner.maxIterationsReason(step)
                : STEP_RUN_NEUTRAL_FAILED_REASON;
            const review = Review.fromData(loaded.value);
            const failed = review.fail({ stepId, reason, now: new Date().toISOString() });
            if (failed.isFail()) {
                this.logger.error(
                    {
                        err: hasErrorSource(failed.error) ? failed.error.source : failed.error,
                        taskId: task.id,
                        reviewId,
                        stepId
                    },
                    "Could not fail the step at the iteration ceiling."
                );
                return;
            }
            const saved = await this.saver.save(review);
            if (saved.isFail()) {
                this.logger.error(
                    {
                        err: hasErrorSource(saved.error) ? saved.error.source : saved.error,
                        taskId: task.id,
                        reviewId,
                        stepId
                    },
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
                    {
                        err: hasErrorSource(loaded.error) ? loaded.error.source : loaded.error,
                        taskId: task.id,
                        reviewId
                    },
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
            // The runner of the step's type names the reason; a type with no runner gets the
            // neutral text (R168).
            const step = loaded.value.steps.find(item => item.id === stepId);
            const runner = step ? this.runners.get(step.type) : null;
            const reason = runner ? runner.failureReasons.aborted : STEP_RUN_NEUTRAL_ABORTED_REASON;
            const review = Review.fromData(loaded.value);
            const failed = review.fail({ stepId, reason, now: new Date().toISOString() });
            if (failed.isFail()) {
                this.logger.error(
                    {
                        err: hasErrorSource(failed.error) ? failed.error.source : failed.error,
                        taskId: task.id,
                        reviewId,
                        stepId
                    },
                    "Could not fail the step after a step run abort."
                );
                return;
            }
            const saved = await this.saver.save(review);
            if (saved.isFail()) {
                this.logger.error(
                    {
                        err: hasErrorSource(saved.error) ? saved.error.source : saved.error,
                        taskId: task.id,
                        reviewId,
                        stepId
                    },
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
        StepRunnerRegistryService,
        ApproveReviewStepUseCase,
        RejectReviewStepUseCase,
        IdentityContext
    ]
});
