import { createAbstraction } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type {
    EntryAfterDeleteEventPayload,
    EntryBeforeDeleteEventPayload,
    EntryDeleteErrorEventPayload
} from "./abstractions.js";

/**
 * Before delete entry event
 */
export class EntryBeforeDeleteEvent extends DomainEvent<EntryBeforeDeleteEventPayload> {
    eventType = "Cms/Entry/BeforeDelete" as const;

    getHandlerAbstraction() {
        return EntryBeforeDeleteEventHandler;
    }
}

export const EntryBeforeDeleteEventHandler = createAbstraction<
    IEventHandler<EntryBeforeDeleteEvent>
>("EntryBeforeDeleteEventHandler");

export namespace EntryBeforeDeleteEventHandler {
    export type Interface = IEventHandler<EntryBeforeDeleteEvent>;
    export type Event = EntryBeforeDeleteEvent;
}

/**
 * After delete entry event
 */
export class EntryAfterDeleteEvent extends DomainEvent<EntryAfterDeleteEventPayload> {
    eventType = "Cms/Entry/AfterDelete" as const;

    getHandlerAbstraction() {
        return EntryAfterDeleteEventHandler;
    }
}

export const EntryAfterDeleteEventHandler = createAbstraction<IEventHandler<EntryAfterDeleteEvent>>(
    "EntryAfterDeleteEventHandler"
);

export namespace EntryAfterDeleteEventHandler {
    export type Interface = IEventHandler<EntryAfterDeleteEvent>;
    export type Event = EntryAfterDeleteEvent;
}

/**
 * Delete entry error event
 */
export class EntryDeleteErrorEvent extends DomainEvent<EntryDeleteErrorEventPayload> {
    eventType = "Cms/Entry/DeleteError" as const;

    getHandlerAbstraction() {
        return EntryDeleteErrorEventHandler;
    }
}

export const EntryDeleteErrorEventHandler = createAbstraction<IEventHandler<EntryDeleteErrorEvent>>(
    "EntryDeleteErrorEventHandler"
);

export namespace EntryDeleteErrorEventHandler {
    export type Interface = IEventHandler<EntryDeleteErrorEvent>;
    export type Event = EntryDeleteErrorEvent;
}
