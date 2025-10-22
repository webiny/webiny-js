import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core";
import type { IEventHandler } from "@webiny/api-core";
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

export class ApiKeyAfterDeleteEvent extends DomainEvent<ApiKeyAfterDeletePayload> {
    eventType = "apiKey.afterDelete" as const;

    getHandlerAbstraction() {
        return ApiKeyAfterDeleteHandler;
    }
}

export const ApiKeyAfterDeleteHandler = createAbstraction<
    IEventHandler<ApiKeyAfterDeleteEvent>
>("ApiKeyAfterDeleteHandler");
