import type { DeletePageUseCasesTopics } from "./index";
import type { DeleteWbPageParams, WbPagesStorageOperations } from "~/page/page.types";
import type { IDeletePage } from "~/page/useCases/DeletePage/IDeletePage";
import { WebinyError } from "@webiny/error";

export class DeletePageWithEvents implements IDeletePage {
    private topics: DeletePageUseCasesTopics;
    private readonly getOperation: WbPagesStorageOperations["get"];
    private readonly decoretee: IDeletePage;

    constructor(
        topics: DeletePageUseCasesTopics,
        getOperation: WbPagesStorageOperations["get"],
        decoretee: IDeletePage
    ) {
        this.topics = topics;
        this.getOperation = getOperation;
        this.decoretee = decoretee;
    }

    async execute(params: DeleteWbPageParams) {
        const page = await this.getOperation({ id: params.id });

        if (!page) {
            throw new WebinyError(
                `Page with id ${params.id} not found`,
                "DELETE_PAGE_WITH_EVENTS_ERROR"
            );
        }

        await this.topics.onWebsiteBuilderPageBeforeDelete.publish({ page });
        await this.decoretee.execute(params);
        await this.topics.onWebsiteBuilderPageAfterDelete.publish({ page });
    }
}
