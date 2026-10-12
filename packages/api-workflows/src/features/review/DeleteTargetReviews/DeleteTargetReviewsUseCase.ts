import { Result } from "@webiny/feature/api";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { AssignmentRepository } from "~/domain/assignment/abstractions/AssignmentRepository.js";
import type { AssignmentPersistenceError } from "~/domain/assignment/errors.js";
import { ReviewPersistenceError } from "~/domain/review/errors.js";
import { DeleteTargetReviewsUseCase as UseCase } from "./abstractions.js";

const ASSIGNMENT_PAGE_SIZE = 100;

export class DeleteTargetReviewsUseCaseImpl implements UseCase.Interface {
    constructor(
        private reviewRepository: ReviewRepository.Interface,
        private assignmentRepository: AssignmentRepository.Interface,
        /** Not injected by the container; tests pass a small page to force several pages. */
        private pageSize: number = ASSIGNMENT_PAGE_SIZE
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
            const records = await this.deleteAssignmentRecords(review.id);
            if (records.isFail()) {
                return Result.fail(new ReviewPersistenceError(records.error));
            }
            const deleted = await this.reviewRepository.delete(review.id);
            if (deleted.isFail()) {
                return Result.fail(deleted.error);
            }
            deletedReviewIds.push(review.id);
        }

        return Result.ok({ deletedReviewIds });
    }

    /** Collects every record id first, so deleting does not shift the cursor pages (R23). */
    private async deleteAssignmentRecords(
        reviewId: string
    ): Promise<Result<void, AssignmentPersistenceError>> {
        const ids: string[] = [];
        let after: string | null = null;
        do {
            const page: Awaited<ReturnType<AssignmentRepository.Interface["list"]>> =
                await this.assignmentRepository.list({
                    where: { reviewId },
                    limit: this.pageSize,
                    after
                });
            if (page.isFail()) {
                return Result.fail(page.error);
            }
            ids.push(...page.value.items.map(item => item.id));
            after = page.value.meta.hasMoreItems ? page.value.meta.cursor : null;
        } while (after);

        for (const id of ids) {
            const deleted = await this.assignmentRepository.delete(id);
            if (deleted.isFail()) {
                return Result.fail(deleted.error);
            }
        }
        return Result.ok();
    }
}

export const DeleteTargetReviewsUseCase = UseCase.createImplementation({
    implementation: DeleteTargetReviewsUseCaseImpl,
    dependencies: [ReviewRepository, AssignmentRepository]
});
