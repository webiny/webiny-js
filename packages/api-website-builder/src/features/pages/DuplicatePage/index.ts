import { Topic } from "@webiny/pubsub/types";
import { DuplicatePage } from "./DuplicatePage";
import { DuplicatePageWithEvents } from "./DuplicatePageWithEvents";
import type {
    OnPageAfterDuplicateTopicParams,
    OnPageBeforeDuplicateTopicParams,
    WbPagesStorageOperations
} from "~/context/pages/pages.types";

export interface DuplicatePageUseCasesTopics {
    onPageBeforeDuplicate: Topic<OnPageBeforeDuplicateTopicParams>;
    onPageAfterDuplicate: Topic<OnPageAfterDuplicateTopicParams>;
}

interface DuplicatePageUseCasesParams {
    createOperation: WbPagesStorageOperations["create"];
    getOperation: WbPagesStorageOperations["getById"];
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
