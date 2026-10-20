import { PageBeforePublishEventHandler } from "@webiny/api-website-builder/features/pages/PublishPage/index.js";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { GetTargetReviewUseCase } from "@webiny/api-workflows/features/review/GetTargetReview/index.js";
import { ReviewPublishBlockedError } from "@webiny/api-workflows/domain/review/errors.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";

/**
 * Publish rule of the `wb.page` adapter (spec 5.1, D79, D121, R53): with a pages workflow, a page
 * revision is published only with its active review approved. Lookup failures block. The CMS
 * adapter's publish rule skips pages (private model, R52). Creating a page revision as published is
 * not a publish and is not blocked (D134 point 2). The throw rejects `PublishPageUseCase` (A26);
 * WB's page resolvers and the scheduler's publish action keep its code and data (R103).
 */
class RequireApprovedReviewOnPagePublishImpl implements PageBeforePublishEventHandler.Interface {
    public constructor(
        private getBoundWorkflow: GetBoundWorkflowUseCase.Interface,
        private getTargetReview: GetTargetReviewUseCase.Interface
    ) {}

    public async handle(event: PageBeforePublishEventHandler.Event): Promise<void> {
        const { page } = event.payload;

        const bound = await this.getBoundWorkflow.execute({ model: WB_PAGE_NAMESPACE });
        if (bound.isFail()) {
            throw bound.error;
        }
        const workflow = bound.value;
        if (!workflow) {
            return;
        }

        const review = await this.getTargetReview.execute({
            model: WB_PAGE_NAMESPACE,
            targetRevisionId: page.id
        });
        if (review.isFail()) {
            throw review.error;
        }
        if (review.value?.state === "approved") {
            return;
        }

        throw new ReviewPublishBlockedError({
            model: WB_PAGE_NAMESPACE,
            targetRevisionId: page.id,
            workflowId: workflow.id,
            reviewState: review.value?.state ?? null
        });
    }
}

export const RequireApprovedReviewOnPagePublish =
    PageBeforePublishEventHandler.createImplementation({
        implementation: RequireApprovedReviewOnPagePublishImpl,
        dependencies: [GetBoundWorkflowUseCase, GetTargetReviewUseCase]
    });
