import { Topic } from "@webiny/pubsub/types";
import { PublishPage } from "./PublishPage";
import { PublishPageWithEvents } from "./PublishPageWithEvents";
import type {
    OnPageAfterPublishTopicParams,
    OnPageBeforePublishTopicParams,
    WbPagesStorageOperations
} from "~/context/pages/pages.types";

export interface PublishPageUseCasesTopics {
    onPageBeforePublish: Topic<OnPageBeforePublishTopicParams>;
    onPageAfterPublish: Topic<OnPageAfterPublishTopicParams>;
}

interface PublishPageUseCasesParams {
    publishOperation: WbPagesStorageOperations["publish"];
    getOperation: WbPagesStorageOperations["getById"];
    topics: PublishPageUseCasesTopics;
}

export const getPublishPageUseCase = (params: PublishPageUseCasesParams) => {
    const publishPage = new PublishPage(params.publishOperation);
    const publishPageUseCase = new PublishPageWithEvents(
        params.topics,
        params.getOperation,
        publishPage
    );

    return {
        publishPageUseCase
    };
};
