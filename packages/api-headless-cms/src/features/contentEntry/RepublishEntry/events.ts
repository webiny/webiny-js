import { createAbstraction } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type {
    EntryAfterRepublishEventPayload,
    EntryBeforeRepublishEventPayload,
    EntryRepublishErrorEventPayload
} from "./abstractions.js";

/**
 * Before republish entry event
 */
export class EntryBeforeRepublishEvent extends DomainEvent<EntryBeforeRepublishEventPayload> {
    eventType = "Cms/Entry/BeforeRepublish" as const;

    getHandlerAbstraction() {
        return EntryBeforeRepublishEventHandler;
    }
}

export const EntryBeforeRepublishEventHandler = createAbstraction<
    IEventHandler<EntryBeforeRepublishEvent>
>("EntryBeforeRepublishEventHandler");

export namespace EntryBeforeRepublishEventHandler {
    export type Interface = IEventHandler<EntryBeforeRepublishEvent>;
    export type Event = EntryBeforeRepublishEvent;
}

/**
 * After republish entry event
 */
export class EntryAfterRepublishEvent extends DomainEvent<EntryAfterRepublishEventPayload> {
    eventType = "Cms/Entry/AfterRepublish" as const;

    getHandlerAbstraction() {
        return EntryAfterRepublishEventHandler;
    }
}

export const EntryAfterRepublishEventHandler = createAbstraction<
    IEventHandler<EntryAfterRepublishEvent>
>("EntryAfterRepublishEventHandler");

export namespace EntryAfterRepublishEventHandler {
    export type Interface = IEventHandler<EntryAfterRepublishEvent>;
    export type Event = EntryAfterRepublishEvent;
}

/**
 * Republish entry error event
 */
export class EntryRepublishErrorEvent extends DomainEvent<EntryRepublishErrorEventPayload> {
    eventType = "Cms/Entry/RepublishError" as const;

    getHandlerAbstraction() {
        return EntryRepublishErrorEventHandler;
    }
}

export const EntryRepublishErrorEventHandler = createAbstraction<
    IEventHandler<EntryRepublishErrorEvent>
>("EntryRepublishErrorEventHandler");

export namespace EntryRepublishErrorEventHandler {
    export type Interface = IEventHandler<EntryRepublishErrorEvent>;
    export type Event = EntryRepublishErrorEvent;
}
