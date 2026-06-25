import {
    BulkActionRunner,
    type Report
} from "@webiny/app-admin/components/BulkActions/BulkActionRunner.js";
import { parseIdentifier } from "@webiny/utils/parseIdentifier.js";
import type { CmsContentEntry } from "~/types.js";
import { DeleteEntryUseCase } from "~/features/contentEntry/deleteEntry/abstractions.js";
import { BulkActionUseCase } from "~/features/contentEntry/bulkAction/abstractions.js";
import { CmsModelContext } from "~/features/contentEntry/abstractions.js";
import { BulkDeletePresenter as Abstraction } from "./abstractions.js";

class BulkDeletePresenterImpl implements Abstraction.Interface {
    private runner = new BulkActionRunner<CmsContentEntry>();

    constructor(
        private deleteEntryUseCase: DeleteEntryUseCase.Interface,
        private bulkActionUseCase: BulkActionUseCase.Interface,
        private modelAccessor: CmsModelContext.Interface
    ) {}

    get vm() {
        return this.runner.vm;
    }

    async execute(items: CmsContentEntry[], allSelected: boolean): Promise<void> {
        await this.runner.run(items, allSelected, {
            onItem: (item, report) => this.deleteItem(item, report),
            onBulk: bulkItems => this.deleteBulk(bulkItems)
        });
    }

    private async deleteItem(item: CmsContentEntry, report: Report): Promise<void> {
        const model = this.modelAccessor.getModel();
        const { id } = parseIdentifier(item.id);
        await this.deleteEntryUseCase.execute({ model, id });
        report.success({ title: item.meta.title, message: "Entry successfully moved to trash." });
    }

    private async deleteBulk(items: CmsContentEntry[]): Promise<void> {
        const model = this.modelAccessor.getModel();
        await this.bulkActionUseCase.execute({
            model,
            action: "MoveToTrash",
            where: { id_in: items.map(i => i.id) }
        });
    }
}

export const BulkDeletePresenter = Abstraction.createImplementation({
    implementation: BulkDeletePresenterImpl,
    dependencies: [DeleteEntryUseCase, BulkActionUseCase, CmsModelContext]
});
