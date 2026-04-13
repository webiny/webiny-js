import { createAbstraction } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { CmsModel, CmsModelCreateInput } from "~/types/index.js";

/**
 * Event payloads
 */
export interface ModelBeforeCreateEventPayload {
    model: CmsModel;
    input: CmsModelCreateInput;
}

export interface ModelAfterCreateEventPayload {
    model: CmsModel;
}

export interface ModelCreateErrorEventPayload {
    input: CmsModelCreateInput;
    model: CmsModel;
    error: Error;
}

/**
 * ModelBeforeCreateEvent - Published before creating a model
 */
export class ModelBeforeCreateEvent extends DomainEvent<ModelBeforeCreateEventPayload> {
    eventType = "Cms/Model/BeforeCreate" as const;

    getHandlerAbstraction() {
        return ModelBeforeCreateEventHandler;
    }
}

/** Hook into model lifecycle before a model is created. */
export const ModelBeforeCreateEventHandler = createAbstraction<
    IEventHandler<ModelBeforeCreateEvent>
>("ModelBeforeCreateEventHandler");

export namespace ModelBeforeCreateEventHandler {
    export type Interface = IEventHandler<ModelBeforeCreateEvent>;
    export type Event = ModelBeforeCreateEvent;
}

/**
 * ModelAfterCreateEvent - Published after creating a model
 */
export class ModelAfterCreateEvent extends DomainEvent<ModelAfterCreateEventPayload> {
    eventType = "Cms/Model/AfterCreate" as const;

    getHandlerAbstraction() {
        return ModelAfterCreateEventHandler;
    }
}

/** Hook into model lifecycle after a model is created. */
export const ModelAfterCreateEventHandler = createAbstraction<IEventHandler<ModelAfterCreateEvent>>(
    "ModelAfterCreateEventHandler"
);

export namespace ModelAfterCreateEventHandler {
    export type Interface = IEventHandler<ModelAfterCreateEvent>;
    export type Event = ModelAfterCreateEvent;
}

/**
 * ModelCreateErrorEvent - Published when create fails
 */
export class ModelCreateErrorEvent extends DomainEvent<ModelCreateErrorEventPayload> {
    eventType = "Cms/Model/CreateError" as const;

    getHandlerAbstraction() {
        return ModelCreateErrorEventHandler;
    }
}

export const ModelCreateErrorEventHandler = createAbstraction<IEventHandler<ModelCreateErrorEvent>>(
    "ModelCreateErrorEventHandler"
);

export namespace ModelCreateErrorEventHandler {
    export type Interface = IEventHandler<ModelCreateErrorEvent>;
    export type Event = ModelCreateErrorEvent;
}
