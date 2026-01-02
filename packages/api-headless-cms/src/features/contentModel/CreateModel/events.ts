import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { CmsModel } from "~/types/index.js";
import type { CmsModelCreateInput } from "~/types/index.js";

/**
 * Event payloads
 */
export interface ModelBeforeCreatePayload {
    model: CmsModel;
    input: CmsModelCreateInput;
}

export interface ModelAfterCreatePayload {
    model: CmsModel;
}

export interface ModelCreateErrorPayload {
    input: CmsModelCreateInput;
    model: CmsModel;
    error: Error;
}

/**
 * ModelBeforeCreateEvent - Published before creating a model
 */
export class ModelBeforeCreateEvent extends DomainEvent<ModelBeforeCreatePayload> {
    eventType = "Cms/Model/BeforeCreate" as const;

    getHandlerAbstraction() {
        return ModelBeforeCreateHandler;
    }
}

export const ModelBeforeCreateHandler = createAbstraction<IEventHandler<ModelBeforeCreateEvent>>(
    "ModelBeforeCreateHandler"
);

export namespace ModelBeforeCreateHandler {
    export type Interface = IEventHandler<ModelBeforeCreateEvent>;
    export type Event = ModelBeforeCreateEvent;
}

/**
 * ModelAfterCreateEvent - Published after creating a model
 */
export class ModelAfterCreateEvent extends DomainEvent<ModelAfterCreatePayload> {
    eventType = "Cms/Model/AfterCreate" as const;

    getHandlerAbstraction() {
        return ModelAfterCreateHandler;
    }
}

export const ModelAfterCreateHandler =
    createAbstraction<IEventHandler<ModelAfterCreateEvent>>("ModelAfterCreateHandler");

export namespace ModelAfterCreateHandler {
    export type Interface = IEventHandler<ModelAfterCreateEvent>;
    export type Event = ModelAfterCreateEvent;
}

/**
 * ModelCreateErrorEvent - Published when create fails
 */
export class ModelCreateErrorEvent extends DomainEvent<ModelCreateErrorPayload> {
    eventType = "Cms/Model/CreateError" as const;

    getHandlerAbstraction() {
        return ModelCreateErrorHandler;
    }
}

export const ModelCreateErrorHandler =
    createAbstraction<IEventHandler<ModelCreateErrorEvent>>("ModelCreateErrorHandler");

export namespace ModelCreateErrorHandler {
    export type Interface = IEventHandler<ModelCreateErrorEvent>;
    export type Event = ModelCreateErrorEvent;
}
