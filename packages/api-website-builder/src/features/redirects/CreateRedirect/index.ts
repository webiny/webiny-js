import type { Topic } from "@webiny/pubsub/types.js";
import { CreateRedirect } from "./CreateRedirect.js";
import { CreateRedirectWithEvents } from "./CreateRedirectWithEvents.js";
import type {
    OnRedirectAfterCreateTopicParams,
    OnRedirectBeforeCreateTopicParams,
    WbRedirectsStorageOperations
} from "~/context/redirects/redirects.types.js";

export interface CreateRedirectUseCasesTopics {
    onRedirectBeforeCreate: Topic<OnRedirectBeforeCreateTopicParams>;
    onRedirectAfterCreate: Topic<OnRedirectAfterCreateTopicParams>;
}

interface CreateRedirectUseCasesParams {
    createOperation: WbRedirectsStorageOperations["create"];
    topics: CreateRedirectUseCasesTopics;
}

export const getCreateRedirectUseCase = (params: CreateRedirectUseCasesParams) => {
    const createRedirect = new CreateRedirect(params.createOperation);
    const createRedirectUseCase = new CreateRedirectWithEvents(params.topics, createRedirect);

    return {
        createRedirectUseCase
    };
};
