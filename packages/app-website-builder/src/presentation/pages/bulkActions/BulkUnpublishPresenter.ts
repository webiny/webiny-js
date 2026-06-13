import {
    BulkActionRunner,
    type Report
} from "@webiny/app-admin/components/BulkActions/BulkActionRunner.js";
import type { Page } from "~/domain/Page/Page.js";
import { UnpublishPageUseCase } from "~/features/pages/unpublishPage/abstractions.js";
import { BulkUnpublishPresenter as Abstraction } from "./abstractions.js";

class BulkUnpublishPresenterImpl implements Abstraction.Interface {
    private runner = new BulkActionRunner<Page>();

    constructor(private unpublishPageUseCase: UnpublishPageUseCase.Interface) {}

    get vm() {
        return this.runner.vm;
    }

    async execute(items: Page[]): Promise<void> {
        await this.runner.run(items, false, {
            onItem: (item, report) => this.unpublishItem(item, report)
        });
    }

    private async unpublishItem(item: Page, report: Report): Promise<void> {
        await this.unpublishPageUseCase.execute({ id: item.id });
        report.success({
            title: item.properties.title,
            message: "Page successfully unpublished."
        });
    }
}

export const BulkUnpublishPresenterImplementation = Abstraction.createImplementation({
    implementation: BulkUnpublishPresenterImpl,
    dependencies: [UnpublishPageUseCase]
});
