import { Result } from "@webiny/feature/api";
import { ReviewTargetFolderChangeGuard as ReviewTargetFolderChangeGuardAbstraction } from "./abstractions.js";
import { GetBoundWorkflowUseCase } from "~/features/workflow/GetBoundWorkflow/index.js";
import { ListTargetReviewsUseCase } from "~/features/review/ListTargetReviews/index.js";
import { ReviewTargetLockedError } from "~/domain/review/errors.js";

class ReviewTargetFolderChangeGuardImpl
    implements ReviewTargetFolderChangeGuardAbstraction.Interface
{
    public constructor(
        private getBoundWorkflow: GetBoundWorkflowUseCase.Interface,
        private listTargetReviews: ListTargetReviewsUseCase.Interface
    ) {}

    public async check(
        params: ReviewTargetFolderChangeGuardAbstraction.Params
    ): ReviewTargetFolderChangeGuardAbstraction.Return {
        const bound = await this.getBoundWorkflow.execute({ model: params.model });
        if (bound.isFail()) {
            return Result.fail(bound.error);
        }
        if (!bound.value) {
            return Result.ok();
        }

        const reviews = await this.listTargetReviews.execute({
            model: params.model,
            targetId: params.targetId
        });
        if (reviews.isFail()) {
            return Result.fail(reviews.error);
        }
        const inProgress = reviews.value.find(review => review.state === "inProgress");
        if (!inProgress) {
            return Result.ok();
        }

        return Result.fail(
            new ReviewTargetLockedError({
                reviewId: inProgress.id,
                model: params.model,
                targetRevisionId: inProgress.targetRevisionId,
                reviewState: inProgress.state,
                action: "move"
            })
        );
    }
}

export const ReviewTargetFolderChangeGuard =
    ReviewTargetFolderChangeGuardAbstraction.createImplementation({
        implementation: ReviewTargetFolderChangeGuardImpl,
        dependencies: [GetBoundWorkflowUseCase, ListTargetReviewsUseCase]
    });
