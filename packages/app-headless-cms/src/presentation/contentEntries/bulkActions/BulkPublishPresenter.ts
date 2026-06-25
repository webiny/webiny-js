import {
    BulkActionRunner,
    type Report
} from "@webiny/app-admin/components/BulkActions/BulkActionRunner.js";
import type { CmsContentEntry } from "~/types.js";
import { PublishEntryUseCase } from "~/features/contentEntry/publishEntry/abstractions.js";
import { BulkActionUseCase } from "~/features/contentEntry/bulkAction/abstractions.js";
import { CmsModelContext } from "~/features/contentEntry/abstractions.js";
import { BulkPublishPresenter as Abstraction } from "./abstractions.js";

class BulkPublishPresenterImpl implements Abstraction.Interface {
    private runner = new BulkActionRunner<CmsContentEntry>();

    constructor(
        private publishEntryUseCase: PublishEntryUseCase.Interface,
        private bulkActionUseCase: BulkActionUseCase.Interface,
        private modelAccessor: CmsModelContext.Interface
    ) {}

    get vm() {
        return this.runner.vm;
    }

    async execute(items: CmsContentEntry[], allSelected: boolean): Promise<void> {
        await this.runner.run(items, allSelected, {
            onItem: (item, report) => this.publishItem(item, report),
            onBulk: bulkItems => this.publishBulk(bulkItems)
        });
    }

    private async publishItem(item: CmsContentEntry, report: Report): Promise<void> {
        const model = this.modelAccessor.getModel();
        await this.publishEntryUseCase.execute({ model, revisionId: item.id });
        report.success({ title: item.meta.title, message: "Entry successfully published." });
    }

    private async publishBulk(items: CmsContentEntry[]): Promise<void> {
        const model = this.modelAccessor.getModel();
        await this.bulkActionUseCase.execute({
            model,
            action: "Publish",
            where: { id_in: items.map(i => i.id) }
        });
    }
}

export const BulkPublishPresenter = Abstraction.createImplementation({
    implementation: BulkPublishPresenterImpl,
    dependencies: [PublishEntryUseCase, BulkActionUseCase, CmsModelContext]
});
