import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "~/features/eventPublisher/index.js";
import type { IEventHandler } from "~/features/eventPublisher/index.js";
import type { ApiKeyBeforeDeletePayload, ApiKeyAfterDeletePayload } from "./abstractions.js";

export class ApiKeyBeforeDeleteEvent extends DomainEvent<ApiKeyBeforeDeletePayload> {
    eventType = "apiKey.beforeDelete" as const;

    getHandlerAbstraction() {
        return ApiKeyBeforeDeleteHandler;
    }
}

export const ApiKeyBeforeDeleteHandler = createAbstraction<
    IEventHandler<ApiKeyBeforeDeleteEvent>
>("ApiKeyBeforeDeleteHandler");

export namespace ApiKeyBeforeDeleteHandler {
    export type Interface = IEventHandler<ApiKeyBeforeDeleteEvent>;
    export type Event = ApiKeyBeforeDeleteEvent;
}

export class ApiKeyAfterDeleteEvent extends DomainEvent<ApiKeyAfterDeletePayload> {
    eventType = "apiKey.afterDelete" as const;

    getHandlerAbstraction() {
        return ApiKeyAfterDeleteHandler;
    }
}

export const ApiKeyAfterDeleteHandler = createAbstraction<
    IEventHandler<ApiKeyAfterDeleteEvent>
>("ApiKeyAfterDeleteHandler");

export namespace ApiKeyAfterDeleteHandler {
    export type Interface = IEventHandler<ApiKeyAfterDeleteEvent>;
    export type Event = ApiKeyAfterDeleteEvent;
}
