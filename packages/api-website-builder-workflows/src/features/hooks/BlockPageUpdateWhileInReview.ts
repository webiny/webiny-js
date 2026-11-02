import { PageBeforeUpdateEventHandler } from "@webiny/api-website-builder/features/pages/UpdatePage/index.js";
import { ReviewTargetUpdateGuard } from "@webiny/api-workflows/features/review/ReviewTargetUpdateGuard/index.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";

/**
 * The save block of the `wb.page` adapter (spec 9.2, D62, D80, R54). The page model publishes no
 * CMS entry events, so the rule listens to the Website Builder page update: with a pages workflow
 * bound, a revision with an active review cannot be updated, including an approved or rejected
 * one. Failed lookups block the update. The `system.workflow` sync writes through
 * `UpdateEntrySystemUseCase` and never reaches this event. The rule itself (binding lookup,
 * review lookup, the automation bypass of D36 and R150) is `ReviewTargetUpdateGuard`, shared with
 * the CMS entry handler.
 */
class BlockPageUpdateWhileInReviewImpl implements PageBeforeUpdateEventHandler.Interface {
    public constructor(private updateGuard: ReviewTargetUpdateGuard.Interface) {}

    public async handle(event: PageBeforeUpdateEventHandler.Event): Promise<void> {
        const { original } = event.payload;

        const checked = await this.updateGuard.check({
            model: WB_PAGE_NAMESPACE,
            targetRevisionId: original.id
        });
        if (checked.isFail()) {
            throw checked.error;
        }
    }
}

export const BlockPageUpdateWhileInReview = PageBeforeUpdateEventHandler.createImplementation({
    implementation: BlockPageUpdateWhileInReviewImpl,
    dependencies: [ReviewTargetUpdateGuard]
});
