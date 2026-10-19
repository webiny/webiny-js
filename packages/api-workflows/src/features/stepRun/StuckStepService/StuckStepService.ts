import { Logger } from "@webiny/api-core/features/logger/index.js";
import { TaskDataStatus } from "@webiny/api-core/features/task/TaskService/index.js";
import { GetTaskUseCase } from "@webiny/background-tasks/api/features/GetTask/index.js";
import { Review } from "~/domain/review/Review.js";
import { ReviewTargetSyncError } from "~/domain/review/errors.js";
import { getStaleStepRunReason } from "~/domain/review/getStaleStepRunReason.js";
import type { ReviewData } from "~/domain/review/types.js";
import {
    STEP_RUN_NEUTRAL_FAILED_REASON,
    STEP_RUN_STUCK_GRACE_MS
} from "~/features/stepRun/constants.js";
import { ReviewSaver } from "~/features/review/ReviewSaver/abstractions.js";
import { StepRunnerRegistryService } from "~/features/stepRun/StepRunnerRegistryService/index.js";
import { StuckStepService as Abstraction } from "./abstractions.js";
import { hasErrorSource } from "~/domain/hasErrorSource.js";

class StuckStepServiceImpl implements Abstraction.Interface {
    constructor(
        private getTask: GetTaskUseCase.Interface,
        private saver: ReviewSaver.Interface,
        private logger: Logger.Interface,
        private runners: StepRunnerRegistryService.Interface
    ) {}

    async check(review: ReviewData): Promise<ReviewData> {
        const step = review.steps.find(item => item.id === review.currentStepId);
        if (!step || step.state !== "inReview") {
            return review;
        }
        const taskId = step.taskId;
        if (!taskId) {
            return review;
        }

        let task: Awaited<GetTaskUseCase.Return>;
        try {
            task = await this.getTask.execute(taskId);
        } catch (error) {
            this.logger.error(
                { error, reviewId: review.id, stepId: step.id, taskId },
                "Could not read the step run task; the review is returned as read."
            );
            return review;
        }
        if (!task) {
            // `getTask` answers null on any read failure, not only not-found: give a missing task
            // the same grace, measured from when the step started (R152).
            const stepSince = Date.parse(step.startedOn ?? step.reachedOn ?? review.lastChangedOn);
            // `!(a > b)` also keeps an unparseable time inside the grace.
            if (!(Date.now() - stepSince > STEP_RUN_STUCK_GRACE_MS)) {
                return review;
            }
        } else {
            // A pending or running task is alive.
            if (
                task.taskStatus === TaskDataStatus.PENDING ||
                task.taskStatus === TaskDataStatus.RUNNING
            ) {
                return review;
            }
            // A failed or aborted task may still be followed by the runner's `onError` /
            // `onAbort` hook, which fails the step with the proper reason: wait out the grace
            // before treating the step as stuck (R152). A `success` task writes nothing more.
            if (task.taskStatus !== TaskDataStatus.SUCCESS) {
                const finishedAt = Date.parse(task.finishedOn ?? task.savedOn);
                // `!(a > b)` also keeps an unparseable time inside the grace.
                if (!(Date.now() - finishedAt > STEP_RUN_STUCK_GRACE_MS)) {
                    return review;
                }
            }
        }

        // A task that is gone has no creator to compare, so the requester stands in for it.
        const stale = getStaleStepRunReason(review, step.id, {
            id: taskId,
            createdById: task ? task.createdBy.id : review.createdBy.id
        });
        if (stale) {
            this.logger.info(
                { reviewId: review.id, stepId: step.id, taskId, reason: stale },
                "Stuck detection skipped a stale step run."
            );
            return review;
        }

        // The runner of the step's type names the reason; a step whose type has no runner (the
        // flag or licence was turned off) is still failed, with the neutral text (R168).
        const runner = this.runners.get(step.type);
        const stuck = Review.fromData(review);
        const failed = stuck.fail({
            stepId: step.id,
            reason: runner ? runner.failureReasons.stuck : STEP_RUN_NEUTRAL_FAILED_REASON,
            now: new Date().toISOString()
        });
        if (failed.isFail()) {
            this.logger.error(
                {
                    err: hasErrorSource(failed.error) ? failed.error.source : failed.error,
                    reviewId: review.id,
                    stepId: step.id,
                    taskId
                },
                "Could not mark the stuck step as failed; the review is returned as read."
            );
            return review;
        }

        try {
            const saved = await this.saver.save(stuck);
            if (saved.isOk()) {
                return saved.value;
            }
            // The review is saved, only the target sync failed (R16): the step is failed. The
            // sync failure is still logged (R159).
            if (saved.error instanceof ReviewTargetSyncError) {
                this.logger.error(
                    {
                        err: hasErrorSource(saved.error) ? saved.error.source : saved.error,
                        reviewId: review.id,
                        stepId: step.id,
                        taskId
                    },
                    "The stuck step was failed, but syncing the target failed."
                );
                return saved.error.data.review;
            }
            this.logger.error(
                {
                    err: hasErrorSource(saved.error) ? saved.error.source : saved.error,
                    reviewId: review.id,
                    stepId: step.id,
                    taskId
                },
                "Could not mark the stuck step as failed; the review is returned as read."
            );
            return review;
        } catch (error) {
            this.logger.error(
                { error, reviewId: review.id, stepId: step.id, taskId },
                "Could not mark the stuck step as failed; the review is returned as read."
            );
            return review;
        }
    }
}

export const StuckStepService = Abstraction.createImplementation({
    implementation: StuckStepServiceImpl,
    dependencies: [GetTaskUseCase, ReviewSaver, Logger, StepRunnerRegistryService]
});
