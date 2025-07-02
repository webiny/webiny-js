import { Topic } from "@webiny/pubsub/types";
import { DeletePage } from "./DeletePage";
import { DeletePageWithEvents } from "./DeletePageWithEvents";
import type {
    OnWebsiteBuilderPageAfterDeleteTopicParams,
    OnWebsiteBuilderPageBeforeDeleteTopicParams,
    WbPagesStorageOperations
} from "~/page/page.types";

export interface DeletePageUseCasesTopics {
    onWebsiteBuilderPageBeforeDelete: Topic<OnWebsiteBuilderPageBeforeDeleteTopicParams>;
    onWebsiteBuilderPageAfterDelete: Topic<OnWebsiteBuilderPageAfterDeleteTopicParams>;
}

interface DeletePageUseCasesParams {
    deleteOperation: WbPagesStorageOperations["delete"];
    getOperation: WbPagesStorageOperations["get"];
    topics: DeletePageUseCasesTopics;
}

export const getDeletePageUseCase = (params: DeletePageUseCasesParams) => {
    const deletePage = new DeletePage(params.deleteOperation);
    const deletePageUseCase = new DeletePageWithEvents(
        params.topics,
        params.getOperation,
        deletePage
    );

    return {
        deletePageUseCase
    };
};
