import { Result } from "@webiny/feature/api";
import { ReviewTargetUpdateGuard as Abstraction } from "./abstractions.js";
import { WorkflowBypassService } from "~/features/bypass/WorkflowBypassService/index.js";
import { GetBoundWorkflowUseCase } from "~/features/workflow/GetBoundWorkflow/index.js";
import { GetTargetReviewUseCase } from "~/features/review/GetTargetReview/index.js";
import { ReviewTargetLockedError } from "~/domain/review/errors.js";

class ReviewTargetUpdateGuardImpl implements Abstraction.Interface {
    public constructor(
        private bypass: WorkflowBypassService.Interface,
        private getBoundWorkflow: GetBoundWorkflowUseCase.Interface,
        private getTargetReview: GetTargetReviewUseCase.Interface
    ) {}

    public async check(params: Abstraction.Params): Abstraction.Return {
        if (this.bypass.isActive()) {
            return Result.ok();
        }

        const workflow = await this.getBoundWorkflow.execute({ model: params.model });
        if (workflow.isFail()) {
            return Result.fail(workflow.error);
        }
        if (!workflow.value) {
            return Result.ok();
        }

        const review = await this.getTargetReview.execute({
            model: params.model,
            targetRevisionId: params.targetRevisionId
        });
        if (review.isFail()) {
            return Result.fail(review.error);
        }
        if (!review.value) {
            return Result.ok();
        }

        return Result.fail(
            new ReviewTargetLockedError({
                reviewId: review.value.id,
                model: params.model,
                targetRevisionId: params.targetRevisionId,
                reviewState: review.value.state,
                action: "update"
            })
        );
    }
}

export const ReviewTargetUpdateGuard = Abstraction.createImplementation({
    implementation: ReviewTargetUpdateGuardImpl,
    dependencies: [WorkflowBypassService, GetBoundWorkflowUseCase, GetTargetReviewUseCase]
});
