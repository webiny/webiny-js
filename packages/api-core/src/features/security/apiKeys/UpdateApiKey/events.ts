import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "~/features/eventPublisher/index.js";
import type { IEventHandler } from "~/features/eventPublisher/index.js";
import type { ApiKeyBeforeUpdatePayload, ApiKeyAfterUpdatePayload } from "./abstractions.js";

export class ApiKeyBeforeUpdateEvent extends DomainEvent<ApiKeyBeforeUpdatePayload> {
    eventType = "apiKey.beforeUpdate" as const;

    getHandlerAbstraction() {
        return ApiKeyBeforeUpdateEventHandler;
    }
}

export const ApiKeyBeforeUpdateEventHandler = createAbstraction<
    IEventHandler<ApiKeyBeforeUpdateEvent>
>("ApiKeyBeforeUpdateEventHandler");

export namespace ApiKeyBeforeUpdateEventHandler {
    export type Interface = IEventHandler<ApiKeyBeforeUpdateEvent>;
    export type Event = ApiKeyBeforeUpdateEvent;
}

export class ApiKeyAfterUpdateEvent extends DomainEvent<ApiKeyAfterUpdatePayload> {
    eventType = "apiKey.afterUpdate" as const;

    getHandlerAbstraction() {
        return ApiKeyAfterUpdateEventHandler;
    }
}

export const ApiKeyAfterUpdateEventHandler = createAbstraction<
    IEventHandler<ApiKeyAfterUpdateEvent>
>("ApiKeyAfterUpdateEventHandler");

export namespace ApiKeyAfterUpdateEventHandler {
    export type Interface = IEventHandler<ApiKeyAfterUpdateEvent>;
    export type Event = ApiKeyAfterUpdateEvent;
}
