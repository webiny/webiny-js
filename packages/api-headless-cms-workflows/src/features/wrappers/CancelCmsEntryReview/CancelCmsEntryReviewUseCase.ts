import { Result } from "@webiny/feature/api";
import { CancelReviewUseCase } from "@webiny/api-workflows/features/review/CancelReview/index.js";
import { canCancelByPermission } from "@webiny/api-workflows/domain/review/canCancelByPermission.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";
import { CancelCmsEntryReviewUseCase as UseCase } from "./abstractions.js";

class CancelCmsEntryReviewUseCaseImpl implements UseCase.Interface {
    public constructor(
        private guard: CmsEntryReviewGuardService.Interface,
        private cancelReview: CancelReviewUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const authorized = await this.guard.authorize({
            reviewId: input.reviewId,
            action: "cancel this review"
        });
        if (authorized.isFail()) {
            return Result.fail(authorized.error);
        }

        const { review, viewer } = authorized.value;
        // Permission only: the review's state is the engine's to report (1b R41).
        if (!canCancelByPermission(review, viewer)) {
            return Result.fail(
                new WorkflowsNotAuthorizedError({
                    action: "cancel a review requested by someone else"
                })
            );
        }

        return this.cancelReview.execute({ reviewId: input.reviewId, actor: viewer.actor });
    }
}

export const CancelCmsEntryReviewUseCase = UseCase.createImplementation({
    implementation: CancelCmsEntryReviewUseCaseImpl,
    dependencies: [CmsEntryReviewGuardService, CancelReviewUseCase]
});
