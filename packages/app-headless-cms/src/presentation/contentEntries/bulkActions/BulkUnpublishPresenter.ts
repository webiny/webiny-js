import {
    BulkActionRunner,
    type Report
} from "@webiny/app-admin/components/BulkActions/BulkActionRunner.js";
import type { CmsContentEntry } from "~/types.js";
import { UnpublishEntryUseCase } from "~/features/contentEntry/unpublishEntry/abstractions.js";
import { BulkActionUseCase } from "~/features/contentEntry/bulkAction/abstractions.js";
import { CmsModelAccessor } from "~/features/contentEntry/abstractions.js";
import { BulkUnpublishPresenter as Abstraction } from "./abstractions.js";

class BulkUnpublishPresenterImpl implements Abstraction.Interface {
    private runner = new BulkActionRunner<CmsContentEntry>();

    constructor(
        private unpublishEntryUseCase: UnpublishEntryUseCase.Interface,
        private bulkActionUseCase: BulkActionUseCase.Interface,
        private modelAccessor: CmsModelAccessor.Interface
    ) {}

    get vm() {
        return this.runner.vm;
    }

    async execute(items: CmsContentEntry[], allSelected: boolean): Promise<void> {
        await this.runner.run(items, allSelected, {
            onItem: (item, report) => this.unpublishItem(item, report),
            onBulk: bulkItems => this.unpublishBulk(bulkItems)
        });
    }


    private async unpublishItem(item: CmsContentEntry, report: Report): Promise<void> {
        const model = this.modelAccessor.getModel();
        await this.unpublishEntryUseCase.execute({ model, revisionId: item.id });
        report.success({ title: item.meta.title, message: "Entry successfully unpublished." });
    }

    private async unpublishBulk(items: CmsContentEntry[]): Promise<void> {
        const model = this.modelAccessor.getModel();
        await this.bulkActionUseCase.execute({
            model,
            action: "Unpublish",
            where: { id_in: items.map(i => i.id) }
        });
    }
}

export const BulkUnpublishPresenterImplementation = Abstraction.createImplementation({
    implementation: BulkUnpublishPresenterImpl,
    dependencies: [UnpublishEntryUseCase, BulkActionUseCase, CmsModelAccessor]
});
