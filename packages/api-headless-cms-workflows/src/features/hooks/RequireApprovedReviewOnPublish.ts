import { EntryBeforePublishEventHandler } from "@webiny/api-headless-cms/features/contentEntry/PublishEntry/index.js";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { GetTargetReviewUseCase } from "@webiny/api-workflows/features/review/GetTargetReview/index.js";
import { getCmsNamespace } from "~/utils/appName.js";
import { assertApprovedReview } from "./assertApprovedReview.js";
import { findBoundWorkflow } from "./findBoundWorkflow.js";

/**
 * Publish rule of the `cms.*` adapter (spec 5.1, D79, D121, R53). On a model bound to a workflow a
 * revision is published only with its active review approved; an approved revision that was
 * unpublished can be published again because approved reviews stay active (D23). Lookup failures
 * block (fail closed). `system.workflow` is not trusted: the update input can set it. Private
 * models (Website Builder pages once 2.4 registers wb.page, R52) are left to their app. Only the
 * publish actions are guarded (this and `RequireApprovedReviewOnRepublish`): creating content as
 * published stays allowed for data transfer (D134 point 2, R83).
 */
class RequireApprovedReviewOnPublishImpl implements EntryBeforePublishEventHandler.Interface {
    public constructor(
        private getBoundWorkflow: GetBoundWorkflowUseCase.Interface,
        private getTargetReview: GetTargetReviewUseCase.Interface
    ) {}

    public async handle(event: EntryBeforePublishEventHandler.Event): Promise<void> {
        const { model, original } = event.payload;
        const namespace = getCmsNamespace(model);
        if (!namespace) {
            return;
        }

        const workflow = await findBoundWorkflow(this.getBoundWorkflow, namespace);
        if (!workflow) {
            return;
        }

        await assertApprovedReview(this.getTargetReview, {
            model: namespace,
            targetRevisionId: original.id,
            workflow
        });
    }
}

export const RequireApprovedReviewOnPublish = EntryBeforePublishEventHandler.createImplementation({
    implementation: RequireApprovedReviewOnPublishImpl,
    dependencies: [GetBoundWorkflowUseCase, GetTargetReviewUseCase]
});
