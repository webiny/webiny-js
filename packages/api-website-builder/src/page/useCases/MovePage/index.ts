import { Topic } from "@webiny/pubsub/types";
import { MovePage } from "./MovePage";
import { MovePageWithEvents } from "./MovePageWithEvents";
import type {
    OnWebsiteBuilderPageAfterMoveTopicParams,
    OnWebsiteBuilderPageBeforeMoveTopicParams,
    WbPagesStorageOperations
} from "~/page/page.types";

export interface MovePageUseCasesTopics {
    onWebsiteBuilderPageBeforeMove: Topic<OnWebsiteBuilderPageBeforeMoveTopicParams>;
    onWebsiteBuilderPageAfterMove: Topic<OnWebsiteBuilderPageAfterMoveTopicParams>;
}

interface MovePageUseCasesParams {
    moveOperation: WbPagesStorageOperations["move"];
    getOperation: WbPagesStorageOperations["get"];
    topics: MovePageUseCasesTopics;
}

export const getMovePageUseCase = (params: MovePageUseCasesParams) => {
    const movePage = new MovePage(params.moveOperation);
    const movePageUseCase = new MovePageWithEvents(params.topics, params.getOperation, movePage);

    return {
        movePageUseCase
    };
};
