import { Topic } from "@webiny/pubsub/types";
import { CreatePage } from "./CreatePage";
import { CreatePageWithEvents } from "./CreatePageWithEvents";
import {
    OnPageAfterCreateTopicParams,
    OnPageBeforeCreateTopicParams,
    WbPagesStorageOperations
} from "~/context/pages/pages.types";

export interface CreatePageUseCasesTopics {
    onPageBeforeCreate: Topic<OnPageBeforeCreateTopicParams>;
    onPageAfterCreate: Topic<OnPageAfterCreateTopicParams>;
}

interface CreatePageUseCasesParams {
    createOperation: WbPagesStorageOperations["create"];
    topics: CreatePageUseCasesTopics;
}

export const getCreatePageUseCase = (params: CreatePageUseCasesParams) => {
    const createPage = new CreatePage(params.createOperation);
    const createPageUseCase = new CreatePageWithEvents(params.topics, createPage);

    return {
        createPageUseCase
    };
};
