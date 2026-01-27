import { createAbstraction } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type {
    EntryRevisionAfterCreateEventPayload,
    EntryRevisionBeforeCreateEventPayload,
    EntryRevisionCreateErrorEventPayload
} from "./abstractions.js";

/**
 * Before create entry revision event
 */
export class EntryRevisionBeforeCreateEvent extends DomainEvent<EntryRevisionBeforeCreateEventPayload> {
    eventType = "Cms/Entry/RevisionBeforeCreate" as const;

    getHandlerAbstraction() {
        return EntryRevisionBeforeCreateEventHandler;
    }
}

export const EntryRevisionBeforeCreateEventHandler = createAbstraction<
    IEventHandler<EntryRevisionBeforeCreateEvent>
>("EntryRevisionBeforeCreateEventHandler");

export namespace EntryRevisionBeforeCreateEventHandler {
    export type Interface = IEventHandler<EntryRevisionBeforeCreateEvent>;
    export type Event = EntryRevisionBeforeCreateEvent;
}

/**
 * After create entry revision event
 */
export class EntryRevisionAfterCreateEvent extends DomainEvent<EntryRevisionAfterCreateEventPayload> {
    eventType = "Cms/Entry/RevisionAfterCreate" as const;

    getHandlerAbstraction() {
        return EntryRevisionAfterCreateEventHandler;
    }
}

export const EntryRevisionAfterCreateEventHandler = createAbstraction<
    IEventHandler<EntryRevisionAfterCreateEvent>
>("EntryRevisionAfterCreateEventHandler");

export namespace EntryRevisionAfterCreateEventHandler {
    export type Interface = IEventHandler<EntryRevisionAfterCreateEvent>;
    export type Event = EntryRevisionAfterCreateEvent;
}

/**
 * Create entry revision error event
 */
export class EntryRevisionCreateErrorEvent extends DomainEvent<EntryRevisionCreateErrorEventPayload> {
    eventType = "Cms/Entry/RevisionCreateError" as const;

    getHandlerAbstraction() {
        return EntryRevisionCreateErrorEventHandler;
    }
}

export const EntryRevisionCreateErrorEventHandler = createAbstraction<
    IEventHandler<EntryRevisionCreateErrorEvent>
>("EntryRevisionCreateErrorEventHandler");

export namespace EntryRevisionCreateErrorEventHandler {
    export type Interface = IEventHandler<EntryRevisionCreateErrorEvent>;
    export type Event = EntryRevisionCreateErrorEvent;
}
