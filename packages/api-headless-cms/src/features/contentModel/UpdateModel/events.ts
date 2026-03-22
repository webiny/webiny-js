import { createAbstraction } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { CmsModel, CmsModelUpdateInput } from "~/types/index.js";

/**
 * Event payloads
 */
export interface ModelBeforeUpdateEventPayload {
    model: CmsModel;
    original: CmsModel;
    input: CmsModelUpdateInput;
}

export interface ModelAfterUpdateEventPayload {
    model: CmsModel;
    original: CmsModel;
}

export interface ModelUpdateErrorEventPayload {
    input: CmsModelUpdateInput;
    model: CmsModel;
    original: CmsModel;
    error: Error;
}

/**
 * ModelBeforeUpdateEvent - Published before updating a model
 */
export class ModelBeforeUpdateEvent extends DomainEvent<ModelBeforeUpdateEventPayload> {
    eventType = "Cms/Model/BeforeUpdate" as const;

    getHandlerAbstraction() {
        return ModelBeforeUpdateEventHandler;
    }
}

/** Hook into model lifecycle before a model is updated. */
export const ModelBeforeUpdateEventHandler = createAbstraction<
    IEventHandler<ModelBeforeUpdateEvent>
>("ModelBeforeUpdateEventHandler");

export namespace ModelBeforeUpdateEventHandler {
    export type Interface = IEventHandler<ModelBeforeUpdateEvent>;
    export type Event = ModelBeforeUpdateEvent;
}

/**
 * ModelAfterUpdateEvent - Published after updating a model
 */
export class ModelAfterUpdateEvent extends DomainEvent<ModelAfterUpdateEventPayload> {
    eventType = "Cms/Model/AfterUpdate" as const;

    getHandlerAbstraction() {
        return ModelAfterUpdateEventHandler;
    }
}

/** Hook into model lifecycle after a model is updated. */
export const ModelAfterUpdateEventHandler = createAbstraction<IEventHandler<ModelAfterUpdateEvent>>(
    "ModelAfterUpdateEventHandler"
);

export namespace ModelAfterUpdateEventHandler {
    export type Interface = IEventHandler<ModelAfterUpdateEvent>;
    export type Event = ModelAfterUpdateEvent;
}

/**
 * ModelUpdateErrorEvent - Published when update fails
 */
export class ModelUpdateErrorEvent extends DomainEvent<ModelUpdateErrorEventPayload> {
    eventType = "Cms/Model/UpdateError" as const;

    getHandlerAbstraction() {
        return ModelUpdateErrorEventHandler;
    }
}

export const ModelUpdateErrorEventHandler = createAbstraction<IEventHandler<ModelUpdateErrorEvent>>(
    "ModelUpdateErrorEventHandler"
);

export namespace ModelUpdateErrorEventHandler {
    export type Interface = IEventHandler<ModelUpdateErrorEvent>;
    export type Event = ModelUpdateErrorEvent;
}
