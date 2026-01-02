import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { CmsModel } from "~/types/index.js";

/**
 * Event payloads
 */
export interface ModelBeforeDeletePayload {
    model: CmsModel;
}

export interface ModelAfterDeletePayload {
    model: CmsModel;
}

export interface ModelDeleteErrorPayload {
    model: CmsModel;
    error: Error;
}

/**
 * ModelBeforeDeleteEvent - Published before deleting a model
 */
export class ModelBeforeDeleteEvent extends DomainEvent<ModelBeforeDeletePayload> {
    eventType = "Cms/Model/BeforeDelete" as const;

    getHandlerAbstraction() {
        return ModelBeforeDeleteHandler;
    }
}

export const ModelBeforeDeleteHandler = createAbstraction<IEventHandler<ModelBeforeDeleteEvent>>(
    "ModelBeforeDeleteHandler"
);

export namespace ModelBeforeDeleteHandler {
    export type Interface = IEventHandler<ModelBeforeDeleteEvent>;
    export type Event = ModelBeforeDeleteEvent;
}

/**
 * ModelAfterDeleteEvent - Published after deleting a model
 */
export class ModelAfterDeleteEvent extends DomainEvent<ModelAfterDeletePayload> {
    eventType = "Cms/Model/AfterDelete" as const;

    getHandlerAbstraction() {
        return ModelAfterDeleteHandler;
    }
}

export const ModelAfterDeleteHandler =
    createAbstraction<IEventHandler<ModelAfterDeleteEvent>>("ModelAfterDeleteHandler");

export namespace ModelAfterDeleteHandler {
    export type Interface = IEventHandler<ModelAfterDeleteEvent>;
    export type Event = ModelAfterDeleteEvent;
}

/**
 * ModelDeleteErrorEvent - Published when delete fails
 */
export class ModelDeleteErrorEvent extends DomainEvent<ModelDeleteErrorPayload> {
    eventType = "Cms/Model/DeleteError" as const;

    getHandlerAbstraction() {
        return ModelDeleteErrorHandler;
    }
}

export const ModelDeleteErrorHandler =
    createAbstraction<IEventHandler<ModelDeleteErrorEvent>>("ModelDeleteErrorHandler");

export namespace ModelDeleteErrorHandler {
    export type Interface = IEventHandler<ModelDeleteErrorEvent>;
    export type Event = ModelDeleteErrorEvent;
}
