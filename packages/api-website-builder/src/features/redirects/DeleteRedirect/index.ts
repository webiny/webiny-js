import { Topic } from "@webiny/pubsub/types";
import { DeleteRedirect } from "./DeleteRedirect";
import { DeleteRedirectWithEvents } from "./DeleteRedirectWithEvents";
import type {
    OnRedirectAfterDeleteTopicParams,
    OnRedirectBeforeDeleteTopicParams,
    WbRedirectsStorageOperations
} from "~/context/redirects/redirects.types";

export interface DeleteRedirectUseCasesTopics {
    onRedirectBeforeDelete: Topic<OnRedirectBeforeDeleteTopicParams>;
    onRedirectAfterDelete: Topic<OnRedirectAfterDeleteTopicParams>;
}

interface DeleteRedirectUseCasesParams {
    deleteOperation: WbRedirectsStorageOperations["delete"];
    getOperation: WbRedirectsStorageOperations["getById"];
    topics: DeleteRedirectUseCasesTopics;
}

export const getDeleteRedirectUseCase = (params: DeleteRedirectUseCasesParams) => {
    const deleteRedirect = new DeleteRedirect(params.deleteOperation);
    const deleteRedirectUseCase = new DeleteRedirectWithEvents(
        params.topics,
        params.getOperation,
        deleteRedirect
    );

    return {
        deleteRedirectUseCase
    };
};
