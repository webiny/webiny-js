import { Topic } from "@webiny/pubsub/types";
import { UnpublishPage } from "./UnpublishPage";
import { UnpublishPageWithEvents } from "./UnpublishPageWithEvents";
import type {
    OnWebsiteBuilderPageAfterUnpublishTopicParams,
    OnWebsiteBuilderPageBeforeUnpublishTopicParams,
    WbPagesStorageOperations
} from "~/page/page.types";

export interface UnpublishPageUseCasesTopics {
    onWebsiteBuilderPageBeforeUnpublish: Topic<OnWebsiteBuilderPageBeforeUnpublishTopicParams>;
    onWebsiteBuilderPageAfterUnpublish: Topic<OnWebsiteBuilderPageAfterUnpublishTopicParams>;
}

interface UnpublishPageUseCasesParams {
    unpublishOperation: WbPagesStorageOperations["unpublish"];
    getOperation: WbPagesStorageOperations["get"];
    topics: UnpublishPageUseCasesTopics;
}

export const getUnpublishPageUseCase = (params: UnpublishPageUseCasesParams) => {
    const unpublishPage = new UnpublishPage(params.unpublishOperation);
    const unpublishPageUseCase = new UnpublishPageWithEvents(
        params.topics,
        params.getOperation,
        unpublishPage
    );

    return {
        unpublishPageUseCase
    };
};
