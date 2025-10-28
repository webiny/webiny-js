import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core";
import type { IEventHandler } from "@webiny/api-core";
import type { ApiKeyBeforeUpdatePayload, ApiKeyAfterUpdatePayload } from "./abstractions.js";

export class ApiKeyBeforeUpdateEvent extends DomainEvent<ApiKeyBeforeUpdatePayload> {
    eventType = "apiKey.beforeUpdate" as const;

    getHandlerAbstraction() {
        return ApiKeyBeforeUpdateHandler;
    }
}

export const ApiKeyBeforeUpdateHandler = createAbstraction<
    IEventHandler<ApiKeyBeforeUpdateEvent>
>("ApiKeyBeforeUpdateHandler");

export namespace ApiKeyBeforeUpdateHandler {
    export type Interface = IEventHandler<ApiKeyBeforeUpdateEvent>;
    export type Event = ApiKeyBeforeUpdateEvent;
}

export class ApiKeyAfterUpdateEvent extends DomainEvent<ApiKeyAfterUpdatePayload> {
    eventType = "apiKey.afterUpdate" as const;

    getHandlerAbstraction() {
        return ApiKeyAfterUpdateHandler;
    }
}

export const ApiKeyAfterUpdateHandler = createAbstraction<
    IEventHandler<ApiKeyAfterUpdateEvent>
>("ApiKeyAfterUpdateHandler");

export namespace ApiKeyAfterUpdateHandler {
    export type Interface = IEventHandler<ApiKeyAfterUpdateEvent>;
    export type Event = ApiKeyAfterUpdateEvent;
}
