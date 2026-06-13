import {
    BulkActionRunner,
    type Report
} from "@webiny/app-admin/components/BulkActions/BulkActionRunner.js";
import type { Page } from "~/domain/Page/Page.js";
import { PublishPageUseCase } from "~/features/pages/publishPage/abstractions.js";
import { BulkPublishPresenter as Abstraction } from "./abstractions.js";

class BulkPublishPresenterImpl implements Abstraction.Interface {
    private runner = new BulkActionRunner<Page>();

    constructor(private publishPageUseCase: PublishPageUseCase.Interface) {}

    get vm() {
        return this.runner.vm;
    }

    async execute(items: Page[]): Promise<void> {
        await this.runner.run(items, false, {
            onItem: (item, report) => this.publishItem(item, report)
        });
    }

    private async publishItem(item: Page, report: Report): Promise<void> {
        await this.publishPageUseCase.execute({ id: item.id });
        report.success({ title: item.properties.title, message: "Page successfully published." });
    }
}

export const BulkPublishPresenterImplementation = Abstraction.createImplementation({
    implementation: BulkPublishPresenterImpl,
    dependencies: [PublishPageUseCase]
});
