import type { IUpdatePage } from "./IUpdatePage";
import type { UpdatePageUseCasesTopics } from "./index";
import type { UpdateWbPageData, WbPagesStorageOperations } from "~/context/pages/pages.types";
import { WebinyError } from "@webiny/error";

export class UpdatePageWithEvents implements IUpdatePage {
    private topics: UpdatePageUseCasesTopics;
    private readonly getOperation: WbPagesStorageOperations["getById"];
    private readonly decoretee: IUpdatePage;

    constructor(
        topics: UpdatePageUseCasesTopics,
        getOperation: WbPagesStorageOperations["getById"],
        decoretee: IUpdatePage
    ) {
        this.topics = topics;
        this.getOperation = getOperation;
        this.decoretee = decoretee;
    }

    async execute(id: string, data: UpdateWbPageData) {
        const original = await this.getOperation(id);

        if (!original) {
            throw new WebinyError(`Page with id ${id} not found`, "UPDATE_PAGE_WITH_EVENTS_ERROR");
        }

        await this.topics.onPageBeforeUpdate.publish({
            original,
            input: { id, data }
        });
        const page = await this.decoretee.execute(id, data);
        await this.topics.onPageAfterUpdate.publish({
            original,
            input: { id, data },
            page
        });

        return page;
    }
}
