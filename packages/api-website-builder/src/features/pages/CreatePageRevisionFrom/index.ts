import { Topic } from "@webiny/pubsub/types";
import { CreatePageRevisionFrom } from "./CreatePageRevisionFrom";
import { CreatePageRevisionFromWithEvents } from "./CreatePageRevisionFromWithEvents";
import type {
    OnPageAfterCreateRevisionFromTopicParams,
    OnPageBeforeCreateRevisionFromTopicParams,
    WbPagesStorageOperations
} from "~/context/pages/pages.types";

export interface CreatePageRevisionFromUseCasesTopics {
    onPageBeforeCreateRevisionFrom: Topic<OnPageBeforeCreateRevisionFromTopicParams>;
    onPageAfterCreateRevisionFrom: Topic<OnPageAfterCreateRevisionFromTopicParams>;
}

interface CreatePageRevisionFromUseCasesParams {
    createRevisionFromOperation: WbPagesStorageOperations["createRevisionFrom"];
    getOperation: WbPagesStorageOperations["getById"];
    topics: CreatePageRevisionFromUseCasesTopics;
}

export const getCreatePageRevisionFromUseCase = (params: CreatePageRevisionFromUseCasesParams) => {
    const createPageRevisionFrom = new CreatePageRevisionFrom(params.createRevisionFromOperation);
    const createPageRevisionFromUseCase = new CreatePageRevisionFromWithEvents(
        params.topics,
        params.getOperation,
        createPageRevisionFrom
    );

    return {
        createPageRevisionFromUseCase
    };
};
