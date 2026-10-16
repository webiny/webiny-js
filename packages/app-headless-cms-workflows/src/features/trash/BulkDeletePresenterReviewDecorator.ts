import { BulkDeletePresenter } from "@webiny/app-headless-cms/presentation/contentEntries/bulkActions/abstractions.js";
import type { CmsContentEntry } from "@webiny/app-headless-cms/types.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuard.js";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases.js";

class BulkDeletePresenterReviewDecoratorImpl implements BulkDeletePresenter.Interface {
    constructor(
        private guard: ActiveReviewGuard.Interface,
        private useCases: CmsReviewUseCases.Interface,
        private decoratee: BulkDeletePresenter.Interface
    ) {}

    get vm() {
        return this.decoratee.vm;
    }

    async execute(items: CmsContentEntry[], allSelected: boolean): Promise<void> {
        await this.guard.runBulk({
            items,
            getTargetId: item => item.entryId,
            run: (batch, isRetry) => this.decoratee.execute(batch, isRetry ? false : allSelected),
            useCases: this.useCases
        });
    }
}

export const BulkDeletePresenterReviewDecorator = BulkDeletePresenter.createDecorator({
    decorator: BulkDeletePresenterReviewDecoratorImpl,
    dependencies: [ActiveReviewGuard, CmsReviewUseCases]
});
