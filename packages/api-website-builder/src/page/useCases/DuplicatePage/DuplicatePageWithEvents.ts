import type { DuplicatePageUseCasesTopics } from "./index";
import type { DuplicateWbPageParams, WbPagesStorageOperations } from "~/page/page.types";
import type { IDuplicatePage } from "./IDuplicatePage";
import { WebinyError } from "@webiny/error";

export class DuplicatePageWithEvents implements IDuplicatePage {
    private topics: DuplicatePageUseCasesTopics;
    private readonly getOperation: WbPagesStorageOperations["get"];
    private readonly decoretee: IDuplicatePage;

    constructor(
        topics: DuplicatePageUseCasesTopics,
        getOperation: WbPagesStorageOperations["get"],
        decoretee: IDuplicatePage
    ) {
        this.topics = topics;
        this.getOperation = getOperation;
        this.decoretee = decoretee;
    }

    async execute(params: DuplicateWbPageParams) {
        const original = await this.getOperation({ id: params.id });

        if (!original) {
            throw new WebinyError(
                `Page with id ${params.id} not found`,
                "DUPLICATE_PAGE_WITH_EVENTS_ERROR"
            );
        }

        await this.topics.onWebsiteBuilderPageBeforeDuplicate.publish({ original });
        const page = await this.decoretee.execute(params);
        await this.topics.onWebsiteBuilderPageAfterDuplicate.publish({ original, page });

        return page;
    }
}
