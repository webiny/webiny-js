import { EntryBeforeDeleteMultipleEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteMultipleEntries/index.js";
import { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { ListReviewsByTargetsUseCase } from "@webiny/api-workflows/features/review/ListReviewsByTargets/index.js";
import { ReviewActiveOnTrashError } from "@webiny/api-workflows/domain/review/errors.js";
import { toBlockingReview } from "@webiny/api-workflows/domain/review/toBlockingReview.js";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { WorkflowBlockingReview } from "@webiny/api-workflows/domain/workflow/types.js";
import { getCmsNamespace } from "~/utils/appName.js";

/**
 * `deleteMultiple` (permanent, up to 50 entries) is refused while any entry it would delete has an
 * in-progress review (D134, R73). Only the entries the caller may access are considered, with the
 * same check `DeleteMultipleEntriesUseCase` applies, so the error never names a review of content
 * the caller cannot see. Bound models only; the binding is looked up once, the reviews of all
 * accessible entries with one engine call (Q79).
 */
class BlockDeleteMultipleWhileInReviewImpl
    implements EntryBeforeDeleteMultipleEventHandler.Interface
{
    public constructor(
        private accessControl: AccessControl.Interface,
        private getBoundWorkflow: GetBoundWorkflowUseCase.Interface,
        private listReviewsByTargets: ListReviewsByTargetsUseCase.Interface
    ) {}

    public async handle(event: EntryBeforeDeleteMultipleEventHandler.Event): Promise<void> {
        const { model, entries } = event.payload;
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

        // In memory: the caller's permissions are already loaded.
        const entryIds: string[] = [];
        for (const entry of entries) {
            if (await this.accessControl.canAccessEntry({ model, entry })) {
                entryIds.push(entry.entryId);
            }
        }
        if (entryIds.length === 0) {
            return;
        }

        // Any failure throws, so the delete is refused.
        const listed = await this.listReviewsByTargets.execute({
            model: namespace,
            targetIds: entryIds
        });
        if (listed.isFail()) {
            throw listed.error;
        }
        const inProgress = new Map<string, ReviewData[]>();
        for (const review of listed.value) {
            if (review.state !== "inProgress") {
                continue;
            }
            const reviews = inProgress.get(review.targetId) ?? [];
            reviews.push(review);
            inProgress.set(review.targetId, reviews);
        }
        // In the order of the entries, each entry's reviews in list order.
        const blocking: WorkflowBlockingReview[] = [];
        for (const entryId of entryIds) {
            const reviews = inProgress.get(entryId) ?? [];
            for (const review of reviews) {
                blocking.push(toBlockingReview(review));
            }
        }
        if (blocking.length === 0) {
            return;
        }

        throw new ReviewActiveOnTrashError({
            model: namespace,
            action: "delete",
            reviews: blocking
        });
    }
}

export const BlockDeleteMultipleWhileInReview =
    EntryBeforeDeleteMultipleEventHandler.createImplementation({
        implementation: BlockDeleteMultipleWhileInReviewImpl,
        dependencies: [AccessControl, GetBoundWorkflowUseCase, ListReviewsByTargetsUseCase]
    });
