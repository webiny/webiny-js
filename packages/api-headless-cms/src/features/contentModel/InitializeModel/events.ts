import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { CmsModel } from "~/types/index.js";

/**
 * Event payload
 */
export interface ModelInitializePayload {
    model: CmsModel;
    data?: Record<string, any>;
}

/**
 * ModelInitializeEvent - Published when initializing a model
 *
 * This event allows plugins to initialize model data (e.g., create default entries)
 */
export class ModelInitializeEvent extends DomainEvent<ModelInitializePayload> {
    eventType = "Cms/Model/Initialize" as const;

    getHandlerAbstraction() {
        return ModelInitializeHandler;
    }
}

export const ModelInitializeHandler = createAbstraction<IEventHandler<ModelInitializeEvent>>(
    "ModelInitializeHandler"
);

export namespace ModelInitializeHandler {
    export type Interface = IEventHandler<ModelInitializeEvent>;
    export type Event = ModelInitializeEvent;
}
