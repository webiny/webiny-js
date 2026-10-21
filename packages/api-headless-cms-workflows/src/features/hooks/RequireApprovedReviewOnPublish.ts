import { EntryBeforePublishEventHandler } from "@webiny/api-headless-cms/features/contentEntry/PublishEntry/index.js";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { GetActiveTargetReviewUseCase } from "@webiny/api-workflows/features/review/GetActiveTargetReview/index.js";
import { ReviewPublishBlockedError } from "@webiny/api-workflows/domain/review/errors.js";
import { getCmsNamespace } from "~/utils/appName.js";

/**
 * Publish rule of the `cms.*` adapter (spec 5.1, D79, D121, R53). On a model bound to a workflow a
 * revision is published only with its active review approved; an approved revision that was
 * unpublished can be published again because approved reviews stay active (D23). Lookup failures
 * block (fail closed). `system.workflow` is not trusted: the update input can set it. Private
 * models (Website Builder pages, R52) are left to their app (`RequireApprovedReviewOnPagePublish`).
 * Only the publish actions are guarded (this and `RequireApprovedReviewOnRepublish`): creating
 * content as published stays allowed for data transfer (D134 point 2, R83).
 */
class RequireApprovedReviewOnPublishImpl implements EntryBeforePublishEventHandler.Interface {
    public constructor(
        private getBoundWorkflow: GetBoundWorkflowUseCase.Interface,
        private getActiveTargetReview: GetActiveTargetReviewUseCase.Interface
    ) {}

    public async handle(event: EntryBeforePublishEventHandler.Event): Promise<void> {
        const { model, original } = event.payload;
        const namespace = getCmsNamespace(model);
        if (!namespace) {
            return;
        }

        const bound = await this.getBoundWorkflow.execute({ model: namespace });
        if (bound.isFail()) {
            throw bound.error;
        }
        if (!bound.value) {
            return;
        }

        const review = await this.getActiveTargetReview.execute({
            model: namespace,
            targetRevisionId: original.id
        });
        if (review.isFail()) {
            throw review.error;
        }
        if (review.value?.state === "approved") {
            return;
        }

        throw new ReviewPublishBlockedError({
            model: namespace,
            targetRevisionId: original.id,
            workflowId: bound.value.id,
            reviewState: review.value?.state ?? null
        });
    }
}

export const RequireApprovedReviewOnPublish = EntryBeforePublishEventHandler.createImplementation({
    implementation: RequireApprovedReviewOnPublishImpl,
    dependencies: [GetBoundWorkflowUseCase, GetActiveTargetReviewUseCase]
});
