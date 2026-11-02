import { PageRevisionAfterDeleteEventHandler } from "@webiny/api-website-builder/features/pages/DeletePageRevision/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { DeleteTargetReviewsUseCase } from "@webiny/api-workflows/features/review/DeleteTargetReviews/index.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";
import { hasErrorSource } from "@webiny/api-workflows/domain/hasErrorSource.js";

/*
 * Deletes the reviews of a deleted page revision with their assignment records (spec 9.3, R56,
 * R235). Deleting the only revision also publishes the page-delete event, which
 * `DeleteReviewsOnPageDelete` handles for every revision. A failure (a failed result or a throw)
 * is logged, not thrown: the revision is already deleted (R81).
 */
class DeleteReviewsOnPageRevisionDeleteImpl
    implements PageRevisionAfterDeleteEventHandler.Interface
{
    public constructor(
        private deleteTargetReviews: DeleteTargetReviewsUseCase.Interface,
        private logger: Logger.Interface
    ) {}

    public async handle(event: PageRevisionAfterDeleteEventHandler.Event): Promise<void> {
        const { page } = event.payload;

        try {
            const deleted = await this.deleteTargetReviews.execute({
                model: WB_PAGE_NAMESPACE,
                targetIds: [page.entryId],
                targetRevisionId: page.id
            });
            if (deleted.isFail()) {
                this.logger.error(
                    {
                        err: hasErrorSource(deleted.error) ? deleted.error.source : deleted.error,
                        model: WB_PAGE_NAMESPACE,
                        targetRevisionId: page.id
                    },
                    "Could not delete the reviews of a deleted page revision; they are left orphaned."
                );
            }
        } catch (error) {
            this.logger.error(
                { err: error, model: WB_PAGE_NAMESPACE, targetRevisionId: page.id },
                "Could not delete the reviews of a deleted page revision; they are left orphaned."
            );
        }
    }
}

export const DeleteReviewsOnPageRevisionDelete =
    PageRevisionAfterDeleteEventHandler.createImplementation({
        implementation: DeleteReviewsOnPageRevisionDeleteImpl,
        dependencies: [DeleteTargetReviewsUseCase, Logger]
    });
