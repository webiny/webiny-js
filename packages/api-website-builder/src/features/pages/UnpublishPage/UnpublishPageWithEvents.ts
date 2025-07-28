import { WebinyError } from "@webiny/error";
import type { UnpublishPageUseCasesTopics } from "./index";
import type { UnpublishWbPageParams, WbPagesStorageOperations } from "~/context/pages/pages.types";
import type { IUnpublishPage } from "./IUnpublishPage";

export class UnpublishPageWithEvents implements IUnpublishPage {
    private topics: UnpublishPageUseCasesTopics;
    private readonly getOperation: WbPagesStorageOperations["getById"];
    private readonly decoretee: IUnpublishPage;

    constructor(
        topics: UnpublishPageUseCasesTopics,
        getOperation: WbPagesStorageOperations["getById"],
        decoretee: IUnpublishPage
    ) {
        this.topics = topics;
        this.getOperation = getOperation;
        this.decoretee = decoretee;
    }

    async execute(params: UnpublishWbPageParams) {
        const page = await this.getOperation(params.id);

        if (!page) {
            throw new WebinyError(
                `Page with id ${params.id} not found`,
                "PUBLISH_PAGE_WITH_EVENTS_ERROR"
            );
        }

        await this.topics.onPageBeforeUnpublish.publish({ page });
        const unpublishedPage = await this.decoretee.execute(params);
        await this.topics.onPageAfterUnpublish.publish({ page: unpublishedPage });

        return unpublishedPage;
    }
}
