import { Result } from "@webiny/feature/api";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { CleanupTaskSubtreeUseCase } from "@webiny/background-tasks/api/features/CleanupTaskSubtree/index.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { AssignmentRepository } from "~/domain/assignment/abstractions/AssignmentRepository.js";
import { ReviewPersistenceError } from "~/domain/review/errors.js";
import { ReviewTaskAbortService } from "~/features/stepRun/ReviewTaskAbortService/index.js";
import { AssignmentPageSize } from "./AssignmentPageSize.js";
import { DeleteTargetReviewsUseCase as UseCase } from "./abstractions.js";

class DeleteTargetReviewsUseCaseImpl implements UseCase.Interface {
    constructor(
        private reviewRepository: ReviewRepository.Interface,
        private assignmentRepository: AssignmentRepository.Interface,
        private assignmentPageSize: AssignmentPageSize.Interface,
        private taskAbort: ReviewTaskAbortService.Interface,
        private cleanupTask: CleanupTaskSubtreeUseCase.Interface,
        private logger: Logger.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const listed = await this.reviewRepository.listByTarget({
            model: input.model,
            targetId: input.targetId,
            targetRevisionId: input.targetRevisionId ?? undefined
        });
        if (listed.isFail()) {
            return Result.fail(listed.error);
        }

        const deletedReviewIds: string[] = [];
        for (const review of listed.value) {
            // Records first: a failure leaves the review in place, so a retry finds it again.
            // Every record id is collected first, so deleting does not shift the cursor pages (R23).
            const recordIds: string[] = [];
            let after: string | null = null;
            do {
                const page: Awaited<ReturnType<AssignmentRepository.Interface["list"]>> =
                    await this.assignmentRepository.list({
                        where: { reviewId: review.id },
                        limit: this.assignmentPageSize.value,
                        after
                    });
                if (page.isFail()) {
                    return Result.fail(new ReviewPersistenceError(page.error));
                }
                recordIds.push(...page.value.items.map(item => item.id));
                after = page.value.meta.hasMoreItems ? page.value.meta.cursor : null;
            } while (after);

            for (const recordId of recordIds) {
                const recordDeleted = await this.assignmentRepository.delete(recordId);
                if (recordDeleted.isFail()) {
                    return Result.fail(new ReviewPersistenceError(recordDeleted.error));
                }
            }
            const deleted = await this.reviewRepository.delete(review.id);
            if (deleted.isFail()) {
                return Result.fail(deleted.error);
            }
            deletedReviewIds.push(review.id);

            // The review is gone, so the task of its in-review step must stop (R151). Only an
            // in-review step has one running. An abort failure is logged by the service and never
            // fails the delete.
            const current = review.steps.find(step => step.id === review.currentStepId);
            const taskIds =
                current && current.state === "inReview" && current.taskId ? [current.taskId] : [];
            await this.taskAbort.abort({ taskIds, message: "The review was deleted." });

            // The run tasks are kept until their review goes (R256): clean up the task of every
            // attempt, earlier attempts oldest first and then the current one. The cleanup
            // documents that it never throws, but a decorator may, so each call has its own
            // `try`: a failure is logged and never fails the delete (the review is already gone,
            // so nothing retries it).
            const taskIdsToClean: string[] = [];
            for (const step of review.steps) {
                for (const run of step.runs) {
                    if (run.taskId) {
                        taskIdsToClean.push(run.taskId);
                    }
                }
                if (step.taskId) {
                    taskIdsToClean.push(step.taskId);
                }
            }
            for (const taskId of taskIdsToClean) {
                try {
                    await this.cleanupTask.execute(taskId);
                } catch (error) {
                    this.logger.error(
                        { error, reviewId: review.id, taskId },
                        "Could not clean up the background task of a deleted review."
                    );
                }
            }
        }

        return Result.ok({ deletedReviewIds });
    }
}

export const DeleteTargetReviewsUseCase = UseCase.createImplementation({
    implementation: DeleteTargetReviewsUseCaseImpl,
    dependencies: [
        ReviewRepository,
        AssignmentRepository,
        AssignmentPageSize,
        ReviewTaskAbortService,
        CleanupTaskSubtreeUseCase,
        Logger
    ]
});
