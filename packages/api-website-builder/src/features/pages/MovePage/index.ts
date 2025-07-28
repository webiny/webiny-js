import { Topic } from "@webiny/pubsub/types";
import { MovePage } from "./MovePage";
import { MovePageWithEvents } from "./MovePageWithEvents";
import type {
    OnPageAfterMoveTopicParams,
    OnPageBeforeMoveTopicParams,
    WbPagesStorageOperations
} from "~/context/pages/pages.types";

export interface MovePageUseCasesTopics {
    onPageBeforeMove: Topic<OnPageBeforeMoveTopicParams>;
    onPageAfterMove: Topic<OnPageAfterMoveTopicParams>;
}

interface MovePageUseCasesParams {
    moveOperation: WbPagesStorageOperations["move"];
    getOperation: WbPagesStorageOperations["getById"];
    topics: MovePageUseCasesTopics;
}

export const getMovePageUseCase = (params: MovePageUseCasesParams) => {
    const movePage = new MovePage(params.moveOperation);
    const movePageUseCase = new MovePageWithEvents(params.topics, params.getOperation, movePage);

    return {
        movePageUseCase
    };
};
