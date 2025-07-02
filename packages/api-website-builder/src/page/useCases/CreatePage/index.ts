import { Topic } from "@webiny/pubsub/types";
import { CreatePage } from "./CreatePage";
import { CreatePageWithEvents } from "./CreatePageWithEvents";
import type {
    OnWebsiteBuilderPageAfterCreateTopicParams,
    OnWebsiteBuilderPageBeforeCreateTopicParams,
    WbPagesStorageOperations
} from "~/page/page.types";

export interface CreatePageUseCasesTopics {
    onWebsiteBuilderPageBeforeCreate: Topic<OnWebsiteBuilderPageBeforeCreateTopicParams>;
    onWebsiteBuilderPageAfterCreate: Topic<OnWebsiteBuilderPageAfterCreateTopicParams>;
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
