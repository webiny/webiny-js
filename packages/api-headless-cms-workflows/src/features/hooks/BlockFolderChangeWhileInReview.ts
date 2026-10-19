import { EntryBeforeUpdateEventHandler } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { ReviewTargetFolderChangeGuard } from "@webiny/api-workflows/features/review/ReviewTargetFolderChangeGuard/index.js";
import { CmsEntryReviewNamespace } from "~/features/target/CmsEntryReviewNamespace/index.js";

/**
 * Move rule of the `cms.*` adapter applied to updates (D84, R55, A24). An update can relocate the
 * entry (`UpdateEntryDataFactory` sets `location` from `wbyAco_location`) without publishing
 * `EntryBeforeMove`, and the save block only checks the updated revision. So when an update changes
 * the folder of an entry of a bound model with a review namespace (CMS entries and pages, R51), any in-progress review of the entry (any
 * revision) refuses it like a move. Updates that keep the folder are left to the save block. The
 * rule itself is `ReviewTargetFolderChangeGuard`, shared with the Website Builder page handler.
 */
class BlockFolderChangeWhileInReviewImpl implements EntryBeforeUpdateEventHandler.Interface {
    public constructor(
        private namespaces: CmsEntryReviewNamespace.Interface[],
        private folderChangeGuard: ReviewTargetFolderChangeGuard.Interface
    ) {}

    public async handle(event: EntryBeforeUpdateEventHandler.Event): Promise<void> {
        const { model, entry, original } = event.payload;
        if (entry.location?.folderId === original.location?.folderId) {
            return;
        }
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

        const checked = await this.folderChangeGuard.check({
            model: namespace,
            targetId: original.entryId
        });
        if (checked.isFail()) {
            throw checked.error;
        }
    }
}

export const BlockFolderChangeWhileInReview = EntryBeforeUpdateEventHandler.createImplementation({
    implementation: BlockFolderChangeWhileInReviewImpl,
    dependencies: [[CmsEntryReviewNamespace, { multiple: true }], ReviewTargetFolderChangeGuard]
});
