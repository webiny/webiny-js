import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { CmsModel } from "~/types/index.js";
import type { CmsModelUpdateInput } from "~/types/index.js";

/**
 * Event payloads
 */
export interface ModelBeforeUpdatePayload {
    model: CmsModel;
    original: CmsModel;
    input: CmsModelUpdateInput;
}

export interface ModelAfterUpdatePayload {
    model: CmsModel;
    original: CmsModel;
}

export interface ModelUpdateErrorPayload {
    input: CmsModelUpdateInput;
    model: CmsModel;
    original: CmsModel;
    error: Error;
}

/**
 * ModelBeforeUpdateEvent - Published before updating a model
 */
export class ModelBeforeUpdateEvent extends DomainEvent<ModelBeforeUpdatePayload> {
    eventType = "Cms/Model/BeforeUpdate" as const;

    getHandlerAbstraction() {
        return ModelBeforeUpdateHandler;
    }
}

export const ModelBeforeUpdateHandler = createAbstraction<IEventHandler<ModelBeforeUpdateEvent>>(
    "ModelBeforeUpdateHandler"
);

export namespace ModelBeforeUpdateHandler {
    export type Interface = IEventHandler<ModelBeforeUpdateEvent>;
    export type Event = ModelBeforeUpdateEvent;
}

/**
 * ModelAfterUpdateEvent - Published after updating a model
 */
export class ModelAfterUpdateEvent extends DomainEvent<ModelAfterUpdatePayload> {
    eventType = "Cms/Model/AfterUpdate" as const;

    getHandlerAbstraction() {
        return ModelAfterUpdateHandler;
    }
}

export const ModelAfterUpdateHandler =
    createAbstraction<IEventHandler<ModelAfterUpdateEvent>>("ModelAfterUpdateHandler");

export namespace ModelAfterUpdateHandler {
    export type Interface = IEventHandler<ModelAfterUpdateEvent>;
    export type Event = ModelAfterUpdateEvent;
}

/**
 * ModelUpdateErrorEvent - Published when update fails
 */
export class ModelUpdateErrorEvent extends DomainEvent<ModelUpdateErrorPayload> {
    eventType = "Cms/Model/UpdateError" as const;

    getHandlerAbstraction() {
        return ModelUpdateErrorHandler;
    }
}

export const ModelUpdateErrorHandler =
    createAbstraction<IEventHandler<ModelUpdateErrorEvent>>("ModelUpdateErrorHandler");

export namespace ModelUpdateErrorHandler {
    export type Interface = IEventHandler<ModelUpdateErrorEvent>;
    export type Event = ModelUpdateErrorEvent;
}
