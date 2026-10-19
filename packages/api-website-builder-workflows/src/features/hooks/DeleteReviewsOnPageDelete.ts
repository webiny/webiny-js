import { PageAfterDeleteEventHandler } from "@webiny/api-website-builder/features/pages/DeletePage/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { DeleteTargetReviewsUseCase } from "@webiny/api-workflows/features/review/DeleteTargetReviews/index.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";
import { hasErrorSource } from "@webiny/api-workflows/domain/hasErrorSource.js";

/**
 * Deletes every review of a permanently deleted page with its assignment records (spec 9.3, R56).
 * `DeletePage` is the only permanent delete of a page today: the CMS "empty trash bin" task skips
 * private models, the page model included. A future bin purge for pages must run this cleanup too,
 * or the reviews are orphaned. A failure (a failed result or a throw) is logged, not thrown: the
 * page is already deleted (R81, A34).
 */
class DeleteReviewsOnPageDeleteImpl implements PageAfterDeleteEventHandler.Interface {
    public constructor(
        private deleteTargetReviews: DeleteTargetReviewsUseCase.Interface,
        private logger: Logger.Interface
    ) {}

    public async handle(event: PageAfterDeleteEventHandler.Event): Promise<void> {
        const { page } = event.payload;

        try {
            const deleted = await this.deleteTargetReviews.execute({
                model: WB_PAGE_NAMESPACE,
                targetId: page.entryId
            });
            if (deleted.isFail()) {
                this.logger.error(
                    {
                        err: hasErrorSource(deleted.error) ? deleted.error.source : deleted.error,
                        model: WB_PAGE_NAMESPACE,
                        targetId: page.entryId
                    },
                    "Could not delete the reviews of a deleted page; they are left orphaned."
                );
            }
        } catch (error) {
            this.logger.error(
                { error, model: WB_PAGE_NAMESPACE, targetId: page.entryId },
                "Could not delete the reviews of a deleted page; they are left orphaned."
            );
        }
    }
}

export const DeleteReviewsOnPageDelete = PageAfterDeleteEventHandler.createImplementation({
    implementation: DeleteReviewsOnPageDeleteImpl,
    dependencies: [DeleteTargetReviewsUseCase, Logger]
});
