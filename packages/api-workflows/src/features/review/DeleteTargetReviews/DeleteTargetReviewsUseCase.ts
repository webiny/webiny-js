import { Result } from "@webiny/feature/api";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { AssignmentRepository } from "~/domain/assignment/abstractions/AssignmentRepository.js";
import { ReviewPersistenceError } from "~/domain/review/errors.js";
import { AssignmentPageSize } from "./AssignmentPageSize.js";
import { DeleteTargetReviewsUseCase as UseCase } from "./abstractions.js";

class DeleteTargetReviewsUseCaseImpl implements UseCase.Interface {
    constructor(
        private reviewRepository: ReviewRepository.Interface,
        private assignmentRepository: AssignmentRepository.Interface,
        private assignmentPageSize: AssignmentPageSize.Interface
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
        }

        return Result.ok({ deletedReviewIds });
    }
}

export const DeleteTargetReviewsUseCase = UseCase.createImplementation({
    implementation: DeleteTargetReviewsUseCaseImpl,
    dependencies: [ReviewRepository, AssignmentRepository, AssignmentPageSize]
});
