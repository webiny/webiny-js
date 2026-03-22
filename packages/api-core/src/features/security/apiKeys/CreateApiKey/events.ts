import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "~/features/eventPublisher/index.js";
import type { IEventHandler } from "~/features/eventPublisher/index.js";
import type { ApiKeyBeforeCreatePayload, ApiKeyAfterCreatePayload } from "./abstractions.js";

export class ApiKeyBeforeCreateEvent extends DomainEvent<ApiKeyBeforeCreatePayload> {
    eventType = "apiKey.beforeCreate" as const;

    getHandlerAbstraction() {
        return ApiKeyBeforeCreateEventHandler;
    }
}

/** Hook into API key lifecycle before an API key is created. */
export const ApiKeyBeforeCreateEventHandler = createAbstraction<
    IEventHandler<ApiKeyBeforeCreateEvent>
>("ApiKeyBeforeCreateEventHandler");

export namespace ApiKeyBeforeCreateEventHandler {
    export type Interface = IEventHandler<ApiKeyBeforeCreateEvent>;
    export type Event = ApiKeyBeforeCreateEvent;
}

export class ApiKeyAfterCreateEvent extends DomainEvent<ApiKeyAfterCreatePayload> {
    eventType = "apiKey.afterCreate" as const;

    getHandlerAbstraction() {
        return ApiKeyAfterCreateEventHandler;
    }
}

/** Hook into API key lifecycle after an API key is created. */
export const ApiKeyAfterCreateEventHandler = createAbstraction<
    IEventHandler<ApiKeyAfterCreateEvent>
>("ApiKeyAfterCreateEventHandler");

export namespace ApiKeyAfterCreateEventHandler {
    export type Interface = IEventHandler<ApiKeyAfterCreateEvent>;
    export type Event = ApiKeyAfterCreateEvent;
}
