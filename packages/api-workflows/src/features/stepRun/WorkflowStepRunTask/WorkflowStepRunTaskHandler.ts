import "@webiny/background-tasks/api/features/TaskController/augmentation.js";
import {
    TaskHandler,
    type TaskDefinition
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { automationStepConfigSchema } from "~/domain/automation/automationStepConfigSchema.js";
import { Review } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewNotFoundError } from "~/domain/review/errors.js";
import { getStaleStepRunReason } from "~/domain/review/getStaleStepRunReason.js";
import { AutomationDefinitionRegistryService } from "~/features/automation/AutomationDefinitionRegistryService/index.js";
import { ReviewSaver } from "~/features/review/ReviewSaver/abstractions.js";
import { DEFAULT_AUTOMATION_MAX_ITERATIONS } from "../constants.js";
import type { StepRunTaskInput } from "../types.js";

type RunParams = TaskHandler.RunParams<StepRunTaskInput>;
type HookParams = TaskHandler.LifecycleHookParams<StepRunTaskInput>;

/**
 * Runs one automation step (spec 7.4, R142). The run itself arrives in Task 12; the failure
 * hooks fail the step when the runner reports an error, the iteration ceiling or an abort. Every
 * hook is guarded (R144): it writes only when the task is the step's current task, was created by
 * the requester and the review is active and in progress; otherwise it logs at info and writes
 * nothing. A hook never throws.
 */
class WorkflowStepRunTaskHandlerImpl implements TaskHandler.Interface<StepRunTaskInput> {
    public constructor(
        private repository: ReviewRepository.Interface,
        private saver: ReviewSaver.Interface,
        private logger: Logger.Interface,
        private definitions: AutomationDefinitionRegistryService.Interface
    ) {}

    public async run({ controller }: RunParams) {
        return controller.response.done();
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
    dependencies: [ReviewRepository, ReviewSaver, Logger, AutomationDefinitionRegistryService]
});
