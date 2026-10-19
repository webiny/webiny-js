import type { Page } from "@webiny/app-website-builder/domain/Page/Page.js";
import { BulkDeletePresenter } from "@webiny/app-website-builder/presentation/pages/bulkActions/abstractions.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuard/abstractions.js";
import { WbReviewUseCases } from "~/features/gateway/WbReviewUseCases/abstractions.js";

class BulkDeletePresenterReviewDecoratorImpl implements BulkDeletePresenter.Interface {
    constructor(
        private guard: ActiveReviewGuard.Interface,
        private useCases: WbReviewUseCases.Interface,
        private decoratee: BulkDeletePresenter.Interface
    ) {}

    get vm() {
        return this.decoratee.vm;
    }

    async execute(items: Page[]): Promise<void> {
        await this.guard.runBulk({
            items,
            getTargetId: row => row.entryId,
            run: batch => this.decoratee.execute(batch),
            useCases: this.useCases
        });
    }
}

export const BulkDeletePresenterReviewDecorator = BulkDeletePresenter.createDecorator({
    decorator: BulkDeletePresenterReviewDecoratorImpl,
    dependencies: [ActiveReviewGuard, WbReviewUseCases]
});
