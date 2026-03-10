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

export const ApiKeyAfterDeleteEventHandler = createAbstraction<
    IEventHandler<ApiKeyAfterDeleteEvent>
>("ApiKeyAfterDeleteEventHandler");

export namespace ApiKeyAfterDeleteEventHandler {
    export type Interface = IEventHandler<ApiKeyAfterDeleteEvent>;
    export type Event = ApiKeyAfterDeleteEvent;
}
