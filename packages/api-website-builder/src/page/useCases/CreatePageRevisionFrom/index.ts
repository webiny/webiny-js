import { Topic } from "@webiny/pubsub/types";
import { CreatePageRevisionFrom } from "./CreatePageRevisionFrom";
import { CreatePageRevisionFromWithEvents } from "./CreatePageRevisionFromWithEvents";
import type {
    OnWebsiteBuilderPageAfterCreateRevisionFromTopicParams,
    OnWebsiteBuilderPageBeforeCreateRevisionFromTopicParams,
    WbPagesStorageOperations
} from "~/page/page.types";

export interface CreatePageRevisionFromUseCasesTopics {
    onWebsiteBuilderPageBeforeCreateRevisionFrom: Topic<OnWebsiteBuilderPageBeforeCreateRevisionFromTopicParams>;
    onWebsiteBuilderPageAfterCreateRevisionFrom: Topic<OnWebsiteBuilderPageAfterCreateRevisionFromTopicParams>;
}

interface CreatePageRevisionFromUseCasesParams {
    createRevisionFromOperation: WbPagesStorageOperations["createRevisionFrom"];
    getOperation: WbPagesStorageOperations["get"];
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
