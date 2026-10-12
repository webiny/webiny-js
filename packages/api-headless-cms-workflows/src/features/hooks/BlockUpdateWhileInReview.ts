import { EntryBeforeUpdateEventHandler } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { GetTargetReviewUseCase } from "@webiny/api-workflows/features/review/GetTargetReview/index.js";
import { ReviewTargetLockedError } from "@webiny/api-workflows/domain/review/errors.js";
import {
    CmsEntryReviewNamespace,
    resolveReviewNamespace
} from "~/features/target/CmsEntryReviewNamespace/index.js";

/**
 * The save block (spec 9.2, D62, D80, D134, R54): on a model bound to a workflow, a revision with
 * an active review cannot be updated, including an approved or rejected one. Covers every model
 * with a review namespace (R51), so CMS entries and Website Builder pages; private models without
 * one (the workflows' own) are skipped. Unbound models never look up reviews. Failed lookups block
 * the update. `UpdateEntrySystemUseCase` does not publish this event, so the `system.workflow`
 * sync is exempt. Phase 5 adds the automation and AI bypass context here (D36, D62), as a check
 * before the binding lookup.
 */
class BlockUpdateWhileInReviewImpl implements EntryBeforeUpdateEventHandler.Interface {
    public constructor(
        private namespaces: CmsEntryReviewNamespace.Interface[],
        private getBoundWorkflow: GetBoundWorkflowUseCase.Interface,
        private getTargetReview: GetTargetReviewUseCase.Interface
    ) {}

    public async handle(event: EntryBeforeUpdateEventHandler.Event): Promise<void> {
        const { model, original } = event.payload;
        const namespace = resolveReviewNamespace(this.namespaces, model);
        if (!namespace) {
            return;
        }

        const workflow = await this.getBoundWorkflow.execute({ model: namespace });
        if (workflow.isFail()) {
            throw workflow.error;
        }
        if (!workflow.value) {
            return;
        }

        const review = await this.getTargetReview.execute({
            model: namespace,
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
            model: namespace,
            targetRevisionId: original.id,
            reviewState: review.value.state,
            action: "update"
        });
    }
}

export const BlockUpdateWhileInReview = EntryBeforeUpdateEventHandler.createImplementation({
    implementation: BlockUpdateWhileInReviewImpl,
    dependencies: [
        [CmsEntryReviewNamespace, { multiple: true }],
        GetBoundWorkflowUseCase,
        GetTargetReviewUseCase
    ]
});
