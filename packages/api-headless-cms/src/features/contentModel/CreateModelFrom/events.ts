import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { CmsModel } from "~/types/index.js";
import type { CmsModelCreateFromInput } from "~/types/index.js";

/**
 * Event payloads
 */
export interface ModelBeforeCreateFromPayload {
    model: CmsModel;
    original: CmsModel;
    input: CmsModelCreateFromInput;
}

export interface ModelAfterCreateFromPayload {
    model: CmsModel;
    original: CmsModel;
}

export interface ModelCreateFromErrorPayload {
    input: CmsModelCreateFromInput;
    model: CmsModel;
    original: CmsModel;
    error: Error;
}

/**
 * ModelBeforeCreateFromEvent - Published before creating a model from existing
 */
export class ModelBeforeCreateFromEvent extends DomainEvent<ModelBeforeCreateFromPayload> {
    eventType = "Cms/Model/BeforeCreateFrom" as const;

    getHandlerAbstraction() {
        return ModelBeforeCreateFromHandler;
    }
}

export const ModelBeforeCreateFromHandler = createAbstraction<
    IEventHandler<ModelBeforeCreateFromEvent>
>("ModelBeforeCreateFromHandler");

export namespace ModelBeforeCreateFromHandler {
    export type Interface = IEventHandler<ModelBeforeCreateFromEvent>;
    export type Event = ModelBeforeCreateFromEvent;
}

/**
 * ModelAfterCreateFromEvent - Published after creating a model from existing
 */
export class ModelAfterCreateFromEvent extends DomainEvent<ModelAfterCreateFromPayload> {
    eventType = "Cms/Model/AfterCreateFrom" as const;

    getHandlerAbstraction() {
        return ModelAfterCreateFromHandler;
    }
}

export const ModelAfterCreateFromHandler = createAbstraction<
    IEventHandler<ModelAfterCreateFromEvent>
>("ModelAfterCreateFromHandler");

export namespace ModelAfterCreateFromHandler {
    export type Interface = IEventHandler<ModelAfterCreateFromEvent>;
    export type Event = ModelAfterCreateFromEvent;
}

/**
 * ModelCreateFromErrorEvent - Published when create from fails
 */
export class ModelCreateFromErrorEvent extends DomainEvent<ModelCreateFromErrorPayload> {
    eventType = "Cms/Model/CreateFromError" as const;

    getHandlerAbstraction() {
        return ModelCreateFromErrorHandler;
    }
}

export const ModelCreateFromErrorHandler = createAbstraction<
    IEventHandler<ModelCreateFromErrorEvent>
>("ModelCreateFromErrorHandler");

export namespace ModelCreateFromErrorHandler {
    export type Interface = IEventHandler<ModelCreateFromErrorEvent>;
    export type Event = ModelCreateFromErrorEvent;
}
