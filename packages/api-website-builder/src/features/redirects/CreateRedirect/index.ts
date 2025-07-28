import { Topic } from "@webiny/pubsub/types";
import { CreateRevision } from "./CreateRevision";
import { CreateRedirectWithEvents } from "./CreateRedirectWithEvents";
import {
    OnRedirectAfterCreateTopicParams,
    OnRedirectBeforeCreateTopicParams,
    WbRedirectsStorageOperations
} from "~/context/redirects/redirects.types";

export interface CreateRedirectUseCasesTopics {
    onRedirectBeforeCreate: Topic<OnRedirectBeforeCreateTopicParams>;
    onRedirectAfterCreate: Topic<OnRedirectAfterCreateTopicParams>;
}

interface CreateRedirectUseCasesParams {
    createOperation: WbRedirectsStorageOperations["create"];
    topics: CreateRedirectUseCasesTopics;
}

export const getCreateRedirectUseCase = (params: CreateRedirectUseCasesParams) => {
    const createRedirect = new CreateRevision(params.createOperation);
    const createRedirectUseCase = new CreateRedirectWithEvents(params.topics, createRedirect);

    return {
        createRedirectUseCase
    };
};
