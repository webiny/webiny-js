import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { CmsModelContext } from "@webiny/app-headless-cms/features/contentEntry/abstractions.js";
import { BulkDeletePresenter } from "@webiny/app-headless-cms/presentation/contentEntries/bulkActions/abstractions.js";
import type { CmsContentEntry } from "@webiny/app-headless-cms/types.js";
import type { BlockingReview } from "@webiny/app-workflows/review/domain/types.js";
import { classifyReviewActionError } from "@webiny/app-workflows/review/presentation/actionDialog/classifyReviewActionError.js";
import { getActionErrorMessage } from "@webiny/app-workflows/review/presentation/actionDialog/getActionErrorMessage.js";
import { REVIEW_TOAST_DURATION } from "@webiny/app-workflows/review/toasts/constants.js";
import { REVIEW_TOAST_POSITION } from "@webiny/app-workflows/review/toasts/constants.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuard/abstractions.js";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases/abstractions.js";
import { createAppName } from "~/utils/appName.js";

// The server refuses more ids per call (BLOCKING_REVIEWS_MAX_IDS, R265).
const PRECHECK_CHUNK_SIZE = 200;

class BulkDeletePresenterReviewDecoratorImpl implements BulkDeletePresenter.Interface {
    constructor(
        private guard: ActiveReviewGuard.Interface,
        private useCases: CmsReviewUseCases.Interface,
        private notifications: Notifications.Interface,
        private modelAccessor: CmsModelContext.Interface,
        private decoratee: BulkDeletePresenter.Interface
    ) {}

    get vm() {
        return this.decoratee.vm;
    }

    async execute(items: CmsContentEntry[], allSelected: boolean): Promise<boolean> {
        if (items.length === 0) {
            return this.decoratee.execute(items, allSelected);
        }

        if (!allSelected) {
            await this.guard.runBulk({
                items,
                getTargetId: item => item.entryId,
                run: async batch => {
                    await this.decoratee.execute(batch, false);
                },
                useCases: this.useCases
            });
            // The per-item results are shown even when the warning was dismissed (8a).
            return true;
        }

        // All loaded rows go to one background task that swallows the workflows refusal (R265),
        // so the reviews in progress are asked for first, by entry id, in chunks of 200.
        const entryIds = Array.from(new Set(items.map(item => item.entryId)));
        const model = this.modelAccessor.getModel();
        const namespace = createAppName(model);
        const reviews: BlockingReview[] = [];

        try {
            for (let start = 0; start < entryIds.length; start += PRECHECK_CHUNK_SIZE) {
                const targetIds = entryIds.slice(start, start + PRECHECK_CHUNK_SIZE);
                const found = await this.useCases.listBlockingReviews({ namespace, targetIds });
                reviews.push(...found);
            }
        } catch (error) {
            const errorKind = classifyReviewActionError(error);
            const title = getActionErrorMessage(errorKind, error);
            this.notifications.error({
                title,
                position: REVIEW_TOAST_POSITION,
                duration: REVIEW_TOAST_DURATION,
                dismissible: true
            });
            return false;
        }

        if (reviews.length === 0) {
            return this.decoratee.execute(items, true);
        }

        let started = false;
        const confirmed = await this.guard.confirmBlocking({
            reviews,
            action: "trash",
            useCases: this.useCases,
            afterCancel: async () => {
                started = await this.decoratee.execute(items, true);
            }
        });

        return confirmed && started;
    }
}

export const BulkDeletePresenterReviewDecorator = BulkDeletePresenter.createDecorator({
    decorator: BulkDeletePresenterReviewDecoratorImpl,
    dependencies: [ActiveReviewGuard, CmsReviewUseCases, Notifications, CmsModelContext]
});
