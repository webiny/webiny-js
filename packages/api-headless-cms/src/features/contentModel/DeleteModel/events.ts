import { createAbstraction } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { CmsModel } from "~/types/index.js";

/**
 * Event payloads
 */
export interface ModelBeforeDeleteEventPayload {
    model: CmsModel;
}

export interface ModelAfterDeleteEventPayload {
    model: CmsModel;
}

export interface ModelDeleteErrorEventPayload {
    model: CmsModel;
    error: Error;
}

/**
 * ModelBeforeDeleteEvent - Published before deleting a model
 */
export class ModelBeforeDeleteEvent extends DomainEvent<ModelBeforeDeleteEventPayload> {
    eventType = "Cms/Model/BeforeDelete" as const;

    getHandlerAbstraction() {
        return ModelBeforeDeleteEventHandler;
    }
}

/** Hook into model lifecycle before a model is deleted. */
export const ModelBeforeDeleteEventHandler = createAbstraction<
    IEventHandler<ModelBeforeDeleteEvent>
>("ModelBeforeDeleteEventHandler");

export namespace ModelBeforeDeleteEventHandler {
    export type Interface = IEventHandler<ModelBeforeDeleteEvent>;
    export type Event = ModelBeforeDeleteEvent;
}

/**
 * ModelAfterDeleteEvent - Published after deleting a model
 */
export class ModelAfterDeleteEvent extends DomainEvent<ModelAfterDeleteEventPayload> {
    eventType = "Cms/Model/AfterDelete" as const;

    getHandlerAbstraction() {
        return ModelAfterDeleteEventHandler;
    }
}

/** Hook into model lifecycle after a model is deleted. */
export const ModelAfterDeleteEventHandler = createAbstraction<IEventHandler<ModelAfterDeleteEvent>>(
    "ModelAfterDeleteEventHandler"
);

export namespace ModelAfterDeleteEventHandler {
    export type Interface = IEventHandler<ModelAfterDeleteEvent>;
    export type Event = ModelAfterDeleteEvent;
}

/**
 * ModelDeleteErrorEvent - Published when delete fails
 */
export class ModelDeleteErrorEvent extends DomainEvent<ModelDeleteErrorEventPayload> {
    eventType = "Cms/Model/DeleteError" as const;

    getHandlerAbstraction() {
        return ModelDeleteErrorEventHandler;
    }
}

export const ModelDeleteErrorEventHandler = createAbstraction<IEventHandler<ModelDeleteErrorEvent>>(
    "ModelDeleteErrorEventHandler"
);

export namespace ModelDeleteErrorEventHandler {
    export type Interface = IEventHandler<ModelDeleteErrorEvent>;
    export type Event = ModelDeleteErrorEvent;
}
