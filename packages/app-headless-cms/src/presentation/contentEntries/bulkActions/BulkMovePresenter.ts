import {
    BulkActionRunner,
    type Report
} from "@webiny/app-admin/components/BulkActions/BulkActionRunner.js";
import type { CmsContentEntry } from "~/types.js";
import { MoveEntryUseCase } from "~/features/contentEntry/moveEntry/abstractions.js";
import { BulkActionUseCase } from "~/features/contentEntry/bulkAction/abstractions.js";
import { CmsModelAccessor } from "~/features/contentEntry/abstractions.js";
import { BulkMovePresenter as Abstraction } from "./abstractions.js";

class BulkMovePresenterImpl implements Abstraction.Interface {
    private runner = new BulkActionRunner<CmsContentEntry>();

    constructor(
        private moveEntryUseCase: MoveEntryUseCase.Interface,
        private bulkActionUseCase: BulkActionUseCase.Interface,
        private modelAccessor: CmsModelAccessor.Interface
    ) {}

    get vm() {
        return this.runner.vm;
    }

    async execute(items: CmsContentEntry[], allSelected: boolean, folderId: string): Promise<void> {
        await this.runner.run(items, allSelected, {
            onItem: (item, report) => this.moveItem(item, report, folderId),
            onBulk: bulkItems => this.moveBulk(bulkItems, folderId)
        });
    }


    private async moveItem(item: CmsContentEntry, report: Report, folderId: string): Promise<void> {
        const model = this.modelAccessor.getModel();
        await this.moveEntryUseCase.execute({ model, id: item.id, folderId });
        report.success({ title: item.meta.title, message: "Entry successfully moved." });
    }

    private async moveBulk(items: CmsContentEntry[], folderId: string): Promise<void> {
        const model = this.modelAccessor.getModel();
        await this.bulkActionUseCase.execute({
            model,
            action: "MoveToFolder",
            where: {
                id_in: items.map(i => i.id),
                wbyAco_location: { folderId_not: folderId }
            },
            data: { folderId }
        });
    }
}

export const BulkMovePresenterImplementation = Abstraction.createImplementation({
    implementation: BulkMovePresenterImpl,
    dependencies: [MoveEntryUseCase, BulkActionUseCase, CmsModelAccessor]
});
