import { PageBeforeUpdateEventHandler } from "@webiny/api-website-builder/features/pages/UpdatePage/index.js";
import { ReviewTargetFolderChangeGuard } from "@webiny/api-workflows/features/review/ReviewTargetFolderChangeGuard/index.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";

/**
 * Move rule of the `wb.page` adapter applied to updates (D84, R55, A24). A page update can carry a
 * new `location`, which relocates the page without `MovePage`, and the save block only checks the
 * updated revision. So when an update changes the folder of a page while a pages workflow is
 * bound, any in-progress review of the page (any revision) refuses it like a move. Updates that
 * keep the folder are left to the save block. Lookup failures block. The rule itself is
 * `ReviewTargetFolderChangeGuard`, shared with the CMS entry handler.
 */
class BlockPageFolderChangeWhileInReviewImpl implements PageBeforeUpdateEventHandler.Interface {
    public constructor(private folderChangeGuard: ReviewTargetFolderChangeGuard.Interface) {}

    public async handle(event: PageBeforeUpdateEventHandler.Event): Promise<void> {
        const { original, input } = event.payload;
        const location = input.data.location;
        if (!location || location.folderId === original.location?.folderId) {
            return;
        }

        const checked = await this.folderChangeGuard.check({
            model: WB_PAGE_NAMESPACE,
            targetId: original.entryId
        });
        if (checked.isFail()) {
            throw checked.error;
        }
    }
}

export const BlockPageFolderChangeWhileInReview = PageBeforeUpdateEventHandler.createImplementation(
    {
        implementation: BlockPageFolderChangeWhileInReviewImpl,
        dependencies: [ReviewTargetFolderChangeGuard]
    }
);
