import type { IUpdatePage } from "./IUpdatePage";
import type { UpdatePageUseCasesTopics } from "./index";
import type { UpdateWbPageData, WbPagesStorageOperations } from "~/page/page.types";
import { WebinyError } from "@webiny/error";

export class UpdatePageWithEvents implements IUpdatePage {
    private topics: UpdatePageUseCasesTopics;
    private readonly getOperation: WbPagesStorageOperations["get"];
    private readonly decoretee: IUpdatePage;

    constructor(
        topics: UpdatePageUseCasesTopics,
        getOperation: WbPagesStorageOperations["get"],
        decoretee: IUpdatePage
    ) {
        this.topics = topics;
        this.getOperation = getOperation;
        this.decoretee = decoretee;
    }

    async execute(id: string, data: UpdateWbPageData) {
        const original = await this.getOperation({ id });

        if (!original) {
            throw new WebinyError(`Page with id ${id} not found`, "UPDATE_PAGE_WITH_EVENTS_ERROR");
        }

        await this.topics.onWebsiteBuilderPageBeforeUpdate.publish({
            original,
            input: { id, data }
        });
        const page = await this.decoretee.execute(id, data);
        await this.topics.onWebsiteBuilderPageAfterUpdate.publish({
            original,
            input: { id, data },
            page
        });

        return page;
    }
}
