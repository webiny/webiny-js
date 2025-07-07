import type { MovePageUseCasesTopics } from "./index";
import type { MoveWbPageParams, WbPagesStorageOperations } from "~/page/page.types";
import type { IMovePage } from "~/page/useCases/MovePage/IMovePage";
import { WebinyError } from "@webiny/error";

export class MovePageWithEvents implements IMovePage {
    private topics: MovePageUseCasesTopics;
    private readonly getOperation: WbPagesStorageOperations["get"];
    private readonly decoretee: IMovePage;

    constructor(
        topics: MovePageUseCasesTopics,
        getOperation: WbPagesStorageOperations["get"],
        decoretee: IMovePage
    ) {
        this.topics = topics;
        this.getOperation = getOperation;
        this.decoretee = decoretee;
    }

    async execute(params: MoveWbPageParams) {
        const page = await this.getOperation({ id: params.id });

        if (!page) {
            throw new WebinyError(
                `Page with id ${params.id} not found`,
                "MOVE_PAGE_WITH_EVENTS_ERROR"
            );
        }

        await this.topics.onWebsiteBuilderPageBeforeMove.publish({
            page,
            folderId: params.folderId
        });
        await this.decoretee.execute(params);
        await this.topics.onWebsiteBuilderPageAfterMove.publish({
            page,
            folderId: params.folderId
        });
    }
}
