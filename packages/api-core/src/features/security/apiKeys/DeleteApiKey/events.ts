import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "~/features/eventPublisher/index.js";
import type { IEventHandler } from "~/features/eventPublisher/index.js";
import type { ApiKeyBeforeDeletePayload, ApiKeyAfterDeletePayload } from "./abstractions.js";

export class ApiKeyBeforeDeleteEvent extends DomainEvent<ApiKeyBeforeDeletePayload> {
    eventType = "apiKey.beforeDelete" as const;

    getHandlerAbstraction() {
        return ApiKeyBeforeDeleteEventHandler;
    }
}

/** Hook into API key lifecycle before an API key is deleted. */
export const ApiKeyBeforeDeleteEventHandler = createAbstraction<
    IEventHandler<ApiKeyBeforeDeleteEvent>
>("ApiKeyBeforeDeleteEventHandler");

export namespace ApiKeyBeforeDeleteEventHandler {
    export type Interface = IEventHandler<ApiKeyBeforeDeleteEvent>;
    export type Event = ApiKeyBeforeDeleteEvent;
}

export class ApiKeyAfterDeleteEvent extends DomainEvent<ApiKeyAfterDeletePayload> {
    eventType = "apiKey.afterDelete" as const;

    getHandlerAbstraction() {
        return ApiKeyAfterDeleteEventHandler;
    }
}

/** Hook into API key lifecycle after an API key is deleted. */
export const ApiKeyAfterDeleteEventHandler = createAbstraction<
    IEventHandler<ApiKeyAfterDeleteEvent>
>("ApiKeyAfterDeleteEventHandler");

export namespace ApiKeyAfterDeleteEventHandler {
    export type Interface = IEventHandler<ApiKeyAfterDeleteEvent>;
    export type Event = ApiKeyAfterDeleteEvent;
}
