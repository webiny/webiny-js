import { Topic } from "@webiny/pubsub/types";
import { DuplicatePage } from "./DuplicatePage";
import { DuplicatePageWithEvents } from "./DuplicatePageWithEvents";
import type {
    OnWebsiteBuilderPageAfterDuplicateTopicParams,
    OnWebsiteBuilderPageBeforeDuplicateTopicParams,
    WbPagesStorageOperations
} from "~/page/page.types";

export interface DuplicatePageUseCasesTopics {
    onWebsiteBuilderPageBeforeDuplicate: Topic<OnWebsiteBuilderPageBeforeDuplicateTopicParams>;
    onWebsiteBuilderPageAfterDuplicate: Topic<OnWebsiteBuilderPageAfterDuplicateTopicParams>;
}

interface DuplicatePageUseCasesParams {
    createOperation: WbPagesStorageOperations["create"];
    getOperation: WbPagesStorageOperations["get"];
    topics: DuplicatePageUseCasesTopics;
}

export const getDuplicatePageUseCase = (params: DuplicatePageUseCasesParams) => {
    const duplicatePage = new DuplicatePage(params.getOperation, params.createOperation);
    const duplicatePageUseCase = new DuplicatePageWithEvents(
        params.topics,
        params.getOperation,
        duplicatePage
    );

    return {
        duplicatePageUseCase
    };
};
