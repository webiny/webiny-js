import { Topic } from "@webiny/pubsub/types";
import { PublishPage } from "./PublishPage";
import { PublishPageWithEvents } from "./PublishPageWithEvents";
import type {
    OnWebsiteBuilderPageAfterPublishTopicParams,
    OnWebsiteBuilderPageBeforePublishTopicParams,
    WbPagesStorageOperations
} from "~/page/page.types";

export interface PublishPageUseCasesTopics {
    onWebsiteBuilderPageBeforePublish: Topic<OnWebsiteBuilderPageBeforePublishTopicParams>;
    onWebsiteBuilderPageAfterPublish: Topic<OnWebsiteBuilderPageAfterPublishTopicParams>;
}

interface PublishPageUseCasesParams {
    publishOperation: WbPagesStorageOperations["publish"];
    getOperation: WbPagesStorageOperations["get"];
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
