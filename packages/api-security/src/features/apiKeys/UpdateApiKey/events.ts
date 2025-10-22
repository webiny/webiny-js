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

export class ApiKeyAfterUpdateEvent extends DomainEvent<ApiKeyAfterUpdatePayload> {
    eventType = "apiKey.afterUpdate" as const;

    getHandlerAbstraction() {
        return ApiKeyAfterUpdateHandler;
    }
}

export const ApiKeyAfterUpdateHandler = createAbstraction<
    IEventHandler<ApiKeyAfterUpdateEvent>
>("ApiKeyAfterUpdateHandler");
