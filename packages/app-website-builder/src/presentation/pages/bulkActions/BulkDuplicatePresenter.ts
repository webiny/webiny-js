import {
    BulkActionRunner,
    type Report
} from "@webiny/app-admin/components/BulkActions/BulkActionRunner.js";
import type { Page } from "~/domain/Page/Page.js";
import { DuplicatePageUseCase } from "~/features/pages/duplicatePage/abstractions.js";
import { BulkDuplicatePresenter as Abstraction } from "./abstractions.js";

class BulkDuplicatePresenterImpl implements Abstraction.Interface {
    private runner = new BulkActionRunner<Page>();

    constructor(private duplicatePageUseCase: DuplicatePageUseCase.Interface) {}

    get vm() {
        return this.runner.vm;
    }

    async execute(items: Page[]): Promise<void> {
        await this.runner.run(items, false, {
            onItem: (item, report) => this.duplicateItem(item, report)
        });
    }

    private async duplicateItem(item: Page, report: Report): Promise<void> {
        await this.duplicatePageUseCase.execute({ id: item.id });
        report.success({
            title: item.properties.title,
            message: "Page successfully duplicated."
        });
    }
}

export const BulkDuplicatePresenterImplementation = Abstraction.createImplementation({
    implementation: BulkDuplicatePresenterImpl,
    dependencies: [DuplicatePageUseCase]
});
