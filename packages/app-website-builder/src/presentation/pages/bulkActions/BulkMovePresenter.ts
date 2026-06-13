import {
    BulkActionRunner,
    type Report
} from "@webiny/app-admin/components/BulkActions/BulkActionRunner.js";
import type { Page } from "~/domain/Page/Page.js";
import { MovePageUseCase } from "~/features/pages/movePage/abstractions.js";
import { BulkMovePresenter as Abstraction } from "./abstractions.js";

class BulkMovePresenterImpl implements Abstraction.Interface {
    private runner = new BulkActionRunner<Page>();

    constructor(private movePageUseCase: MovePageUseCase.Interface) {}

    get vm() {
        return this.runner.vm;
    }

    async execute(items: Page[], folderId: string): Promise<void> {
        await this.runner.run(items, false, {
            onItem: (item, report) => this.moveItem(item, report, folderId)
        });
    }

    private async moveItem(item: Page, report: Report, folderId: string): Promise<void> {
        await this.movePageUseCase.execute({ id: item.id, folderId });
        report.success({ title: item.properties.title, message: "Page successfully moved." });
    }
}

export const BulkMovePresenterImplementation = Abstraction.createImplementation({
    implementation: BulkMovePresenterImpl,
    dependencies: [MovePageUseCase]
});
