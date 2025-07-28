import type { MovePageUseCasesTopics } from "./index";
import type { MoveWbPageParams, WbPagesStorageOperations } from "~/context/pages/pages.types";
import type { IMovePage } from "~/features/pages/MovePage/IMovePage";
import { WebinyError } from "@webiny/error";

export class MovePageWithEvents implements IMovePage {
    private topics: MovePageUseCasesTopics;
    private readonly getOperation: WbPagesStorageOperations["getById"];
    private readonly decoretee: IMovePage;

    constructor(
        topics: MovePageUseCasesTopics,
        getOperation: WbPagesStorageOperations["getById"],
        decoretee: IMovePage
    ) {
        this.topics = topics;
        this.getOperation = getOperation;
        this.decoretee = decoretee;
    }

    async execute(params: MoveWbPageParams) {
        const page = await this.getOperation(params.id);

        if (!page) {
            throw new WebinyError(
                `Page with id ${params.id} not found`,
                "MOVE_PAGE_WITH_EVENTS_ERROR"
            );
        }

        await this.topics.onPageBeforeMove.publish({
            page,
            folderId: params.folderId
        });
        await this.decoretee.execute(params);
        await this.topics.onPageAfterMove.publish({
            page,
            folderId: params.folderId
        });
    }
}
