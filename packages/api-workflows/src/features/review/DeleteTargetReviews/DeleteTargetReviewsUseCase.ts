import { Result } from "@webiny/feature/api";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { CleanupTaskSubtreeUseCase } from "@webiny/background-tasks/api/features/CleanupTaskSubtree/index.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { AssignmentRepository } from "~/domain/assignment/abstractions/AssignmentRepository.js";
import { ReviewPersistenceError } from "~/domain/review/errors.js";
import { Review } from "~/domain/review/Review.js";
import { ReviewTaskAbortService } from "~/features/stepRun/ReviewTaskAbortService/index.js";
import { forEachWithConcurrency } from "~/domain/forEachWithConcurrency.js";
import { toChunks } from "~/domain/toChunks.js";
import { AssignmentPageSize } from "./AssignmentPageSize.js";
import { DeleteTargetReviewsUseCase as UseCase } from "./abstractions.js";

type AssignmentListPage = Awaited<ReturnType<AssignmentRepository.Interface["list"]>>;

/** Reviews per batch: one record list, one delete per repository and one abort call each. */
const REVIEW_BATCH_SIZE = 50;
/** How many task cleanups run at once. */
const CLEANUP_CONCURRENCY = 5;

/** One run task of a deleted review to clean up. */
interface TaskCleanup {
    reviewId: string;
    taskId: string;
}

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
        // One list for every target (Q79); a revision delete keeps only that revision's reviews.
        const listed = await this.reviewRepository.listByTargets({
            model: input.model,
            targetIds: input.targetIds
        });
        if (listed.isFail()) {
            return Result.fail(listed.error);
        }
        const reviews = listed.value.filter(review => {
            return !input.targetRevisionId || review.targetRevisionId === input.targetRevisionId;
        });

        const deletedReviewIds: string[] = [];
        // A batch of reviews at a time: list their records, delete the records and then the
        // reviews, then stop the tasks of the deleted reviews. A failure leaves the batch's
        // reviews in place (records go first), so a retry finds them again, and every review
        // deleted before it already had its tasks stopped.
        for (const batch of toChunks(reviews, REVIEW_BATCH_SIZE)) {
            const reviewIds = batch.map(review => review.id);

            // Every record id is collected first, so deleting does not shift the cursor pages (R23).
            const recordIds: string[] = [];
            let after: string | null = null;
            do {
                // oxlint-disable-next-line no-await-in-loop -- one query per page of the batch's records.
                const page: AssignmentListPage = await this.assignmentRepository.list({
                    where: { reviewId_in: reviewIds },
                    limit: this.assignmentPageSize.value,
                    after
                });
                if (page.isFail()) {
                    return Result.fail(new ReviewPersistenceError(page.error));
                }
                recordIds.push(...page.value.items.map(item => item.id));
                after = page.value.meta.hasMoreItems ? page.value.meta.cursor : null;
            } while (after);

            // oxlint-disable-next-line no-await-in-loop -- one repository delete call per batch of reviews.
            const recordsDeleted = await this.assignmentRepository.deleteMany(recordIds);
            if (recordsDeleted.isFail()) {
                return Result.fail(new ReviewPersistenceError(recordsDeleted.error));
            }
            // oxlint-disable-next-line no-await-in-loop -- one repository delete call per batch of reviews.
            const deleted = await this.reviewRepository.deleteMany(reviewIds);
            if (deleted.isFail()) {
                return Result.fail(deleted.error);
            }
            deletedReviewIds.push(...reviewIds);

            // The reviews are gone, so the tasks of their in-review steps must stop (R151): one
            // abort call for the batch. An abort failure is logged by the service and never fails
            // the delete.
            const runningTaskIds: string[] = [];
            const cleanups: TaskCleanup[] = [];
            for (const review of batch) {
                const aggregate = Review.fromData(review);
                const runningTaskId = aggregate.getRunningTaskId();
                if (runningTaskId) {
                    runningTaskIds.push(runningTaskId);
                }
                for (const taskId of aggregate.getTaskIds()) {
                    cleanups.push({ reviewId: review.id, taskId });
                }
            }
            // oxlint-disable-next-line no-await-in-loop -- one abort call per batch of reviews.
            await this.taskAbort.abort({
                taskIds: runningTaskIds,
                message: "The review was deleted."
            });

            // The run tasks are kept until their review goes (R256): clean up the task of every
            // attempt. `CleanupTaskSubtreeUseCase` takes one task id and has no batch form, so the
            // calls run a few at a time. The cleanup documents that it never throws, but a
            // decorator may, so each call has its own `try`: a failure is logged and never fails
            // the delete (the review is already gone, so nothing retries it).
            // oxlint-disable-next-line no-await-in-loop -- one concurrency-limited cleanup run per batch of reviews.
            await forEachWithConcurrency(cleanups, CLEANUP_CONCURRENCY, async cleanup => {
                try {
                    await this.cleanupTask.execute(cleanup.taskId);
                } catch (error) {
                    this.logger.error(
                        { err: error, reviewId: cleanup.reviewId, taskId: cleanup.taskId },
                        "Could not clean up the background task of a deleted review."
                    );
                }
            });
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
