import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core";
import type { IEventHandler } from "@webiny/api-core";
import type { ApiKeyBeforeCreatePayload, ApiKeyAfterCreatePayload } from "./abstractions.js";

export class ApiKeyBeforeCreateEvent extends DomainEvent<ApiKeyBeforeCreatePayload> {
    eventType = "apiKey.beforeCreate" as const;

    getHandlerAbstraction() {
        return ApiKeyBeforeCreateHandler;
    }
}

export const ApiKeyBeforeCreateHandler = createAbstraction<
    IEventHandler<ApiKeyBeforeCreateEvent>
>("ApiKeyBeforeCreateHandler");

export namespace ApiKeyBeforeCreateHandler {
    export type Interface = IEventHandler<ApiKeyBeforeCreateEvent>;
    export type Event = ApiKeyBeforeCreateEvent;
}

export class ApiKeyAfterCreateEvent extends DomainEvent<ApiKeyAfterCreatePayload> {
    eventType = "apiKey.afterCreate" as const;

    getHandlerAbstraction() {
        return ApiKeyAfterCreateHandler;
    }
}

export const ApiKeyAfterCreateHandler = createAbstraction<
    IEventHandler<ApiKeyAfterCreateEvent>
>("ApiKeyAfterCreateHandler");

export namespace ApiKeyAfterCreateHandler {
    export type Interface = IEventHandler<ApiKeyAfterCreateEvent>;
    export type Event = ApiKeyAfterCreateEvent;
}
