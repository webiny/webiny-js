import { EntryBeforeRepublishEventHandler } from "@webiny/api-headless-cms/features/contentEntry/RepublishEntry/index.js";
import { GetRevisionByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionById/index.js";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { GetTargetReviewUseCase } from "@webiny/api-workflows/features/review/GetTargetReview/index.js";
import { ReviewPublishBlockedError } from "@webiny/api-workflows/domain/review/errors.js";
import { getCmsNamespace } from "~/utils/appName.js";

/**
 * Publish rule for `republish<Model>(revision)` (D79, R53). `RepublishEntryUseCase` takes any
 * revision and publishes `EntryBeforeRepublish`, not `EntryBeforePublish`, so without this rule an
 * unapproved draft of a bound model could be published. The payload's `status` is already set to
 * published, so the stored revision is read as the caller: one that is already published is only
 * refreshed and allowed; any other needs an approved review, as for publish. Private models are left to their
 * app (R52); unbound models never look up reviews; failed lookups block (fail closed).
 */
class RequireApprovedReviewOnRepublishImpl implements EntryBeforeRepublishEventHandler.Interface {
    public constructor(
        private getRevisionById: GetRevisionByIdUseCase.Interface,
        private getBoundWorkflow: GetBoundWorkflowUseCase.Interface,
        private getTargetReview: GetTargetReviewUseCase.Interface
    ) {}

    public async handle(event: EntryBeforeRepublishEventHandler.Event): Promise<void> {
        const { model, entry } = event.payload;
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

        const stored = await this.getRevisionById.execute(model, entry.id);
        if (stored.isFail()) {
            throw stored.error;
        }
        if (stored.value.status === "published") {
            return;
        }

        const review = await this.getTargetReview.execute({
            model: namespace,
            targetRevisionId: entry.id
        });
        if (review.isFail()) {
            throw review.error;
        }
        if (review.value?.state === "approved") {
            return;
        }

        throw new ReviewPublishBlockedError({
            model: namespace,
            targetRevisionId: entry.id,
            workflowId: bound.value.id,
            reviewState: review.value?.state ?? null
        });
    }
}

export const RequireApprovedReviewOnRepublish =
    EntryBeforeRepublishEventHandler.createImplementation({
        implementation: RequireApprovedReviewOnRepublishImpl,
        dependencies: [GetRevisionByIdUseCase, GetBoundWorkflowUseCase, GetTargetReviewUseCase]
    });
