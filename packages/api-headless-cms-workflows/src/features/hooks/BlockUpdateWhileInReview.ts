import { EntryBeforeUpdateEventHandler } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { ReviewTargetUpdateGuard } from "@webiny/api-workflows/features/review/ReviewTargetUpdateGuard/index.js";
import { CmsEntryReviewNamespace } from "~/features/target/CmsEntryReviewNamespace/index.js";

/**
 * The save block (spec 9.2, D62, D80, D134, R54): on a model bound to a workflow, a revision with
 * an active review cannot be updated, including an approved or rejected one. Covers every model
 * with a review namespace (R51), so CMS entries, and Website Builder pages through
 * `WbPageReviewNamespace`; private models without one (the workflows' own) are skipped. Unbound
 * models never look up reviews. Failed lookups block the update. Exempt, because they publish
 * other events: the `system.workflow` sync (`UpdateEntrySystemUseCase` publishes
 * `EntryBeforeUpdateSystem`) and revision-description changes (`UpdateRevisionDescriptionUseCase`
 * publishes `EntryBeforeUpdateRevisionDescription`; metadata only, not content). The rule itself
 * (binding lookup, review lookup, the automation bypass) is `ReviewTargetUpdateGuard`, shared with
 * the Website Builder page handler.
 */
class BlockUpdateWhileInReviewImpl implements EntryBeforeUpdateEventHandler.Interface {
    public constructor(
        private namespaces: CmsEntryReviewNamespace.Interface[],
        private updateGuard: ReviewTargetUpdateGuard.Interface
    ) {}

    public async handle(event: EntryBeforeUpdateEventHandler.Event): Promise<void> {
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

        const checked = await this.updateGuard.check({
            model: namespace,
            targetRevisionId: original.id
        });
        if (checked.isFail()) {
            throw checked.error;
        }
    }
}

export const BlockUpdateWhileInReview = EntryBeforeUpdateEventHandler.createImplementation({
    implementation: BlockUpdateWhileInReviewImpl,
    dependencies: [[CmsEntryReviewNamespace, { multiple: true }], ReviewTargetUpdateGuard]
});
