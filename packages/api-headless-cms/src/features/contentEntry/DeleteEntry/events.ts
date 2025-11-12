import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type {
    EntryBeforeDeletePayload,
    EntryAfterDeletePayload,
    EntryDeleteErrorPayload
} from "./abstractions.js";

/**
 * Before delete entry event
 */
export class EntryBeforeDeleteEvent extends DomainEvent<EntryBeforeDeletePayload> {
    eventType = "Cms/Entry/BeforeDelete" as const;

    getHandlerAbstraction() {
        return EntryBeforeDeleteHandler;
    }
}

export const EntryBeforeDeleteHandler = createAbstraction<IEventHandler<EntryBeforeDeleteEvent>>(
    "EntryBeforeDeleteHandler"
);

export namespace EntryBeforeDeleteHandler {
    export type Interface = IEventHandler<EntryBeforeDeleteEvent>;
    export type Event = EntryBeforeDeleteEvent;
}

/**
 * After delete entry event
 */
export class EntryAfterDeleteEvent extends DomainEvent<EntryAfterDeletePayload> {
    eventType = "Cms/Entry/AfterDelete" as const;

    getHandlerAbstraction() {
        return EntryAfterDeleteHandler;
    }
}

export const EntryAfterDeleteHandler = createAbstraction<IEventHandler<EntryAfterDeleteEvent>>(
    "EntryAfterDeleteHandler"
);

export namespace EntryAfterDeleteHandler {
    export type Interface = IEventHandler<EntryAfterDeleteEvent>;
    export type Event = EntryAfterDeleteEvent;
}

/**
 * Delete entry error event
 */
export class EntryDeleteErrorEvent extends DomainEvent<EntryDeleteErrorPayload> {
    eventType = "Cms/Entry/DeleteError" as const;

    getHandlerAbstraction() {
        return EntryDeleteErrorHandler;
    }
}

export const EntryDeleteErrorHandler = createAbstraction<IEventHandler<EntryDeleteErrorEvent>>(
    "EntryDeleteErrorHandler"
);

export namespace EntryDeleteErrorHandler {
    export type Interface = IEventHandler<EntryDeleteErrorEvent>;
    export type Event = EntryDeleteErrorEvent;
}
