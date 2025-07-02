import { Topic } from "@webiny/pubsub/types";
import { UpdatePage } from "./UpdatePage";
import { UpdatePageWithEvents } from "./UpdatePageWithEvents";
import type {
    OnWebsiteBuilderPageAfterUpdateTopicParams,
    OnWebsiteBuilderPageBeforeUpdateTopicParams,
    WbPagesStorageOperations
} from "~/page/page.types";

export interface UpdatePageUseCasesTopics {
    onWebsiteBuilderPageBeforeUpdate: Topic<OnWebsiteBuilderPageBeforeUpdateTopicParams>;
    onWebsiteBuilderPageAfterUpdate: Topic<OnWebsiteBuilderPageAfterUpdateTopicParams>;
}

interface UpdatePageUseCasesParams {
    updateOperation: WbPagesStorageOperations["update"];
    getOperation: WbPagesStorageOperations["get"];
    topics: UpdatePageUseCasesTopics;
}

export const getUpdatePagerUseCase = (params: UpdatePageUseCasesParams) => {
    const updatePage = new UpdatePage(params.updateOperation);
    const updatePageUseCase = new UpdatePageWithEvents(
        params.topics,
        params.getOperation,
        updatePage
    );

    return {
        updatePageUseCase
    };
};
