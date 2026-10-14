import { EntryBeforeUpdateEventHandler } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { GetTargetReviewUseCase } from "@webiny/api-workflows/features/review/GetTargetReview/index.js";
import { WorkflowBypassService } from "@webiny/api-workflows/features/bypass/WorkflowBypassService/index.js";
import { ReviewTargetLockedError } from "@webiny/api-workflows/domain/review/errors.js";
import { CmsEntryReviewNamespace } from "~/features/target/CmsEntryReviewNamespace/index.js";

/**
 * The save block (spec 9.2, D62, D80, D134, R54): on a model bound to a workflow, a revision with
 * an active review cannot be updated, including an approved or rejected one. Covers every model
 * with a review namespace (R51), so CMS entries, and Website Builder pages through
 * `WbPageReviewNamespace`; private models without one (the workflows' own) are skipped. Unbound
 * models never look up reviews. Failed lookups block the update. Exempt, because they publish
 * other events: the `system.workflow` sync (`UpdateEntrySystemUseCase` publishes
 * `EntryBeforeUpdateSystem`) and revision-description changes (`UpdateRevisionDescriptionUseCase`
 * publishes `EntryBeforeUpdateRevisionDescription`; metadata only, not content). The automation
 * run is exempt too (D36, D62, R150): while `WorkflowBypassService.isActive()` the handler returns
 * before the binding lookup. Only this save block honours the bypass; the move rule (D84) and the
 * delete and trash blocks (D134) do not.
 */
class BlockUpdateWhileInReviewImpl implements EntryBeforeUpdateEventHandler.Interface {
    public constructor(
        private bypass: WorkflowBypassService.Interface,
        private namespaces: CmsEntryReviewNamespace.Interface[],
        private getBoundWorkflow: GetBoundWorkflowUseCase.Interface,
        private getTargetReview: GetTargetReviewUseCase.Interface
    ) {}

    public async handle(event: EntryBeforeUpdateEventHandler.Event): Promise<void> {
        if (this.bypass.isActive()) {
            return;
        }

        const { model, original } = event.payload;
        // The last registered non-null namespace for the model wins (R51).
        let namespace: string | null = null;
        for (const candidate of [...this.namespaces].reverse()) {
            const resolved = candidate.resolve(model);
            if (resolved) {
                namespace = resolved;
                break;
            }
        }
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
        WorkflowBypassService,
        [CmsEntryReviewNamespace, { multiple: true }],
        GetBoundWorkflowUseCase,
        GetTargetReviewUseCase
    ]
});
