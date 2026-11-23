import { Result } from "@webiny/feature/api";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { GetActiveTargetReviewUseCase } from "@webiny/api-workflows/features/review/GetActiveTargetReview/index.js";
import { ReviewPublishBlockedError } from "@webiny/api-workflows/domain/review/errors.js";
import { ApprovedReviewPublishRule as Abstraction } from "./abstractions.js";

class ApprovedReviewPublishRuleImpl implements Abstraction.Interface {
    public constructor(
        private getBoundWorkflow: GetBoundWorkflowUseCase.Interface,
        private getActiveTargetReview: GetActiveTargetReviewUseCase.Interface
    ) {}

    public async check(params: Abstraction.Params): Abstraction.Return {
        const { namespace, targetRevisionId } = params;

        const bound = await this.getBoundWorkflow.execute({ model: namespace });
        if (bound.isFail()) {
            return Result.fail(bound.error);
        }
        if (!bound.value) {
            return Result.ok();
        }

        const review = await this.getActiveTargetReview.execute({
            model: namespace,
            targetRevisionId
        });
        if (review.isFail()) {
            return Result.fail(review.error);
        }
        if (review.value?.state === "approved") {
            return Result.ok();
        }

        return Result.fail(
            new ReviewPublishBlockedError({
                model: namespace,
                targetRevisionId,
                workflowId: bound.value.id,
                reviewState: review.value?.state ?? null
            })
        );
    }
}

export const ApprovedReviewPublishRule = Abstraction.createImplementation({
    implementation: ApprovedReviewPublishRuleImpl,
    dependencies: [GetBoundWorkflowUseCase, GetActiveTargetReviewUseCase]
});
