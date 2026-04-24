import { createAbstraction } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { CmsModel, CmsModelCreateFromInput } from "~/types/index.js";

/**
 * Event payloads
 */
export interface ModelBeforeCreateFromEventPayload {
    model: CmsModel;
    original: CmsModel;
    input: CmsModelCreateFromInput;
}

export interface ModelAfterCreateFromEventPayload {
    model: CmsModel;
    original: CmsModel;
}

export interface ModelCreateFromErrorEventPayload {
    input: CmsModelCreateFromInput;
    model: CmsModel;
    original: CmsModel;
    error: Error;
}

/**
 * ModelBeforeCreateFromEvent - Published before creating a model from existing
 */
export class ModelBeforeCreateFromEvent extends DomainEvent<ModelBeforeCreateFromEventPayload> {
    eventType = "Cms/Model/BeforeCreateFrom" as const;

    getHandlerAbstraction() {
        return ModelBeforeCreateFromEventHandler;
    }
}

/** Hook into model lifecycle before a model is cloned. */
export const ModelBeforeCreateFromEventHandler = createAbstraction<
    IEventHandler<ModelBeforeCreateFromEvent>
>("ModelBeforeCreateFromEventHandler");

export namespace ModelBeforeCreateFromEventHandler {
    export type Interface = IEventHandler<ModelBeforeCreateFromEvent>;
    export type Event = ModelBeforeCreateFromEvent;
}

/**
 * ModelAfterCreateFromEvent - Published after creating a model from existing
 */
export class ModelAfterCreateFromEvent extends DomainEvent<ModelAfterCreateFromEventPayload> {
    eventType = "Cms/Model/AfterCreateFrom" as const;

    getHandlerAbstraction() {
        return ModelAfterCreateFromEventHandler;
    }
}

/** Hook into model lifecycle after a model is cloned. */
export const ModelAfterCreateFromEventHandler = createAbstraction<
    IEventHandler<ModelAfterCreateFromEvent>
>("ModelAfterCreateFromEventHandler");

export namespace ModelAfterCreateFromEventHandler {
    export type Interface = IEventHandler<ModelAfterCreateFromEvent>;
    export type Event = ModelAfterCreateFromEvent;
}

/**
 * ModelCreateFromErrorEvent - Published when create from fails
 */
export class ModelCreateFromErrorEvent extends DomainEvent<ModelCreateFromErrorEventPayload> {
    eventType = "Cms/Model/CreateFromError" as const;

    getHandlerAbstraction() {
        return ModelCreateFromErrorEventHandler;
    }
}

export const ModelCreateFromErrorEventHandler = createAbstraction<
    IEventHandler<ModelCreateFromErrorEvent>
>("ModelCreateFromErrorEventHandler");

export namespace ModelCreateFromErrorEventHandler {
    export type Interface = IEventHandler<ModelCreateFromErrorEvent>;
    export type Event = ModelCreateFromErrorEvent;
}
