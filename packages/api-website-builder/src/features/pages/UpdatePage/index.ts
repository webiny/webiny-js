import { Topic } from "@webiny/pubsub/types";
import { UpdatePage } from "./UpdatePage";
import { UpdatePageWithEvents } from "./UpdatePageWithEvents";
import type {
    OnPageAfterUpdateTopicParams,
    OnPageBeforeUpdateTopicParams,
    WbPagesStorageOperations
} from "~/context/pages/pages.types";

export interface UpdatePageUseCasesTopics {
    onPageBeforeUpdate: Topic<OnPageBeforeUpdateTopicParams>;
    onPageAfterUpdate: Topic<OnPageAfterUpdateTopicParams>;
}

interface UpdatePageUseCasesParams {
    updateOperation: WbPagesStorageOperations["update"];
    getOperation: WbPagesStorageOperations["getById"];
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
