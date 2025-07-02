import type { CreatePageRevisionFromUseCasesTopics } from "./index";
import type { CreateWbPageRevisionFromParams, WbPagesStorageOperations } from "~/page/page.types";
import type { ICreatePageRevisionFrom } from "./ICreatePageRevisionFrom";
import { WebinyError } from "@webiny/error";

export class CreatePageRevisionFromWithEvents implements ICreatePageRevisionFrom {
    private topics: CreatePageRevisionFromUseCasesTopics;
    private readonly getOperation: WbPagesStorageOperations["get"];
    private readonly decoretee: ICreatePageRevisionFrom;

    constructor(
        topics: CreatePageRevisionFromUseCasesTopics,
        getOperation: WbPagesStorageOperations["get"],
        decoretee: ICreatePageRevisionFrom
    ) {
        this.topics = topics;
        this.getOperation = getOperation;
        this.decoretee = decoretee;
    }

    async execute(params: CreateWbPageRevisionFromParams) {
        const original = await this.getOperation({ id: params.id });

        if (!original) {
            throw new WebinyError(
                `Page with id ${params.id} not found`,
                "CREATE_PAGE_REVISION_FROM_WITH_EVENTS_ERROR"
            );
        }

        await this.topics.onWebsiteBuilderPageBeforeCreateRevisionFrom.publish({ original });
        const page = await this.decoretee.execute(params);
        await this.topics.onWebsiteBuilderPageAfterCreateRevisionFrom.publish({ original, page });

        return page;
    }
}
