import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type {
    EntryBeforeRepublishPayload,
    EntryAfterRepublishPayload,
    EntryRepublishErrorPayload
} from "./abstractions.js";

/**
 * Before republish entry event
 */
export class EntryBeforeRepublishEvent extends DomainEvent<EntryBeforeRepublishPayload> {
    eventType = "Cms/Entry/BeforeRepublish" as const;

    getHandlerAbstraction() {
        return EntryBeforeRepublishHandler;
    }
}

export const EntryBeforeRepublishHandler = createAbstraction<
    IEventHandler<EntryBeforeRepublishEvent>
>("EntryBeforeRepublishHandler");

export namespace EntryBeforeRepublishHandler {
    export type Interface = IEventHandler<EntryBeforeRepublishEvent>;
    export type Event = EntryBeforeRepublishEvent;
}

/**
 * After republish entry event
 */
export class EntryAfterRepublishEvent extends DomainEvent<EntryAfterRepublishPayload> {
    eventType = "Cms/Entry/AfterRepublish" as const;

    getHandlerAbstraction() {
        return EntryAfterRepublishHandler;
    }
}

export const EntryAfterRepublishHandler = createAbstraction<
    IEventHandler<EntryAfterRepublishEvent>
>("EntryAfterRepublishHandler");

export namespace EntryAfterRepublishHandler {
    export type Interface = IEventHandler<EntryAfterRepublishEvent>;
    export type Event = EntryAfterRepublishEvent;
}

/**
 * Republish entry error event
 */
export class EntryRepublishErrorEvent extends DomainEvent<EntryRepublishErrorPayload> {
    eventType = "Cms/Entry/RepublishError" as const;

    getHandlerAbstraction() {
        return EntryRepublishErrorHandler;
    }
}

export const EntryRepublishErrorHandler = createAbstraction<
    IEventHandler<EntryRepublishErrorEvent>
>("EntryRepublishErrorHandler");

export namespace EntryRepublishErrorHandler {
    export type Interface = IEventHandler<EntryRepublishErrorEvent>;
    export type Event = EntryRepublishErrorEvent;
}
