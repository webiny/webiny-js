import { PageBeforeUpdateEventHandler } from "@webiny/api-website-builder/features/pages/UpdatePage/index.js";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { GetTargetReviewUseCase } from "@webiny/api-workflows/features/review/GetTargetReview/index.js";
import { WorkflowBypassService } from "@webiny/api-workflows/features/bypass/WorkflowBypassService/index.js";
import { ReviewTargetLockedError } from "@webiny/api-workflows/domain/review/errors.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";

/**
 * The save block of the `wb.page` adapter (spec 9.2, D62, D80, R54). The page model publishes no
 * CMS entry events, so the rule listens to the Website Builder page update: with a pages workflow
 * bound, a revision with an active review cannot be updated, including an approved or rejected
 * one. Failed lookups block the update. The `system.workflow` sync writes through
 * `UpdateEntrySystemUseCase` and never reaches this event. The automation run is exempt (D36,
 * R150): while `WorkflowBypassService.isActive()` the handler returns before the binding lookup.
 */
class BlockPageUpdateWhileInReviewImpl implements PageBeforeUpdateEventHandler.Interface {
    public constructor(
        private bypass: WorkflowBypassService.Interface,
        private getBoundWorkflow: GetBoundWorkflowUseCase.Interface,
        private getTargetReview: GetTargetReviewUseCase.Interface
    ) {}

    public async handle(event: PageBeforeUpdateEventHandler.Event): Promise<void> {
        if (this.bypass.isActive()) {
            return;
        }

        const { original } = event.payload;

        const bound = await this.getBoundWorkflow.execute({ model: WB_PAGE_NAMESPACE });
        if (bound.isFail()) {
            throw bound.error;
        }
        if (!bound.value) {
            return;
        }

        const review = await this.getTargetReview.execute({
            model: WB_PAGE_NAMESPACE,
            targetRevisionId: original.id
        });
        if (review.isFail()) {
            throw review.error;
        }
        if (!review.value) {
            return;
        }

        throw new ReviewTargetLockedError({
            reviewId: review.value.id,
            model: WB_PAGE_NAMESPACE,
            targetRevisionId: original.id,
            reviewState: review.value.state,
            action: "update"
        });
    }
}

export const BlockPageUpdateWhileInReview = PageBeforeUpdateEventHandler.createImplementation({
    implementation: BlockPageUpdateWhileInReviewImpl,
    dependencies: [WorkflowBypassService, GetBoundWorkflowUseCase, GetTargetReviewUseCase]
});
