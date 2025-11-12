import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type {
    EntryBeforePublishPayload,
    EntryAfterPublishPayload,
    EntryPublishErrorPayload
} from "./abstractions.js";

/**
 * Before publish entry event
 */
export class EntryBeforePublishEvent extends DomainEvent<EntryBeforePublishPayload> {
    eventType = "entry.beforePublish" as const;

    getHandlerAbstraction() {
        return EntryBeforePublishHandler;
    }
}

export const EntryBeforePublishHandler = createAbstraction<IEventHandler<EntryBeforePublishEvent>>(
    "EntryBeforePublishHandler"
);

export namespace EntryBeforePublishHandler {
    export type Interface = IEventHandler<EntryBeforePublishEvent>;
    export type Event = EntryBeforePublishEvent;
}

/**
 * After publish entry event
 */
export class EntryAfterPublishEvent extends DomainEvent<EntryAfterPublishPayload> {
    eventType = "entry.afterPublish" as const;

    getHandlerAbstraction() {
        return EntryAfterPublishHandler;
    }
}

export const EntryAfterPublishHandler = createAbstraction<IEventHandler<EntryAfterPublishEvent>>(
    "EntryAfterPublishHandler"
);

export namespace EntryAfterPublishHandler {
    export type Interface = IEventHandler<EntryAfterPublishEvent>;
    export type Event = EntryAfterPublishEvent;
}

/**
 * Publish entry error event
 */
export class EntryPublishErrorEvent extends DomainEvent<EntryPublishErrorPayload> {
    eventType = "entry.publishError" as const;

    getHandlerAbstraction() {
        return EntryPublishErrorHandler;
    }
}

export const EntryPublishErrorHandler = createAbstraction<IEventHandler<EntryPublishErrorEvent>>(
    "EntryPublishErrorHandler"
);

export namespace EntryPublishErrorHandler {
    export type Interface = IEventHandler<EntryPublishErrorEvent>;
    export type Event = EntryPublishErrorEvent;
}
