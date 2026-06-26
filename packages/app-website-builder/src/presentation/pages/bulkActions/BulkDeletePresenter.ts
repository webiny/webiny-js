import {
    BulkActionRunner,
    type Report
} from "@webiny/app-admin/components/BulkActions/BulkActionRunner.js";
import type { Page } from "~/domain/Page/Page.js";
import { DeletePageUseCase } from "~/features/pages/deletePage/abstractions.js";
import { BulkDeletePresenter as Abstraction } from "./abstractions.js";

class BulkDeletePresenterImpl implements Abstraction.Interface {
    private runner = new BulkActionRunner<Page>();

    constructor(private deletePageUseCase: DeletePageUseCase.Interface) {}

    get vm() {
        return this.runner.vm;
    }

    async execute(items: Page[]): Promise<void> {
        await this.runner.run(items, false, {
            onItem: (item, report) => this.deleteItem(item, report)
        });
    }

    private async deleteItem(item: Page, report: Report): Promise<void> {
        await this.deletePageUseCase.execute({ id: item.id, permanently: false });
        report.success({ title: item.properties.title, message: "Page successfully deleted." });
    }
}

export const BulkDeletePresenter = Abstraction.createImplementation({
    implementation: BulkDeletePresenterImpl,
    dependencies: [DeletePageUseCase]
});
