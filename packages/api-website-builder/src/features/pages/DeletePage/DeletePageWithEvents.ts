import { WebinyError } from "@webiny/error";
import type { IDeletePage } from "./IDeletePage";
import { DeleteWbPageParams, WbPagesStorageOperations } from "~/context/pages/pages.types";
import { DeletePageUseCasesTopics } from "~/features/pages";

export class DeletePageWithEvents implements IDeletePage {
    private topics: DeletePageUseCasesTopics;
    private readonly getOperation: WbPagesStorageOperations["getById"];
    private readonly decoretee: IDeletePage;

    constructor(
        topics: DeletePageUseCasesTopics,
        getOperation: WbPagesStorageOperations["getById"],
        decoretee: IDeletePage
    ) {
        this.topics = topics;
        this.getOperation = getOperation;
        this.decoretee = decoretee;
    }

    async execute(params: DeleteWbPageParams) {
        const page = await this.getOperation(params.id);

        if (!page) {
            throw new WebinyError(
                `Page with id ${params.id} not found`,
                "DELETE_PAGE_WITH_EVENTS_ERROR"
            );
        }

        await this.topics.onPageBeforeDelete.publish({ page });
        await this.decoretee.execute(params);
        await this.topics.onPageAfterDelete.publish({ page });
    }
}
