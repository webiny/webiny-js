import { createAbstraction } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type {
    EntryRevisionAfterDeletePayload,
    EntryRevisionBeforeDeletePayload,
    EntryRevisionDeleteErrorPayload
} from "./abstractions.js";

/**
 * Before delete revision event
 */
export class EntryRevisionBeforeDeleteEvent extends DomainEvent<EntryRevisionBeforeDeletePayload> {
    eventType = "Cms/Entry/RevisionBeforeDelete" as const;

    getHandlerAbstraction() {
        return EntryRevisionBeforeDeleteEventHandler;
    }
}

export const EntryRevisionBeforeDeleteEventHandler = createAbstraction<
    IEventHandler<EntryRevisionBeforeDeleteEvent>
>("EntryRevisionBeforeDeleteEventHandler");

export namespace EntryRevisionBeforeDeleteEventHandler {
    export type Interface = IEventHandler<EntryRevisionBeforeDeleteEvent>;
    export type Event = EntryRevisionBeforeDeleteEvent;
}

/**
 * After delete revision event
 */
export class EntryRevisionAfterDeleteEvent extends DomainEvent<EntryRevisionAfterDeletePayload> {
    eventType = "Cms/Entry/RevisionAfterDelete" as const;

    getHandlerAbstraction() {
        return EntryRevisionAfterDeleteEventHandler;
    }
}

export const EntryRevisionAfterDeleteEventHandler = createAbstraction<
    IEventHandler<EntryRevisionAfterDeleteEvent>
>("EntryRevisionAfterDeleteEventHandler");

export namespace EntryRevisionAfterDeleteEventHandler {
    export type Interface = IEventHandler<EntryRevisionAfterDeleteEvent>;
    export type Event = EntryRevisionAfterDeleteEvent;
}

/**
 * Delete revision error event
 */
export class EntryRevisionDeleteErrorEvent extends DomainEvent<EntryRevisionDeleteErrorPayload> {
    eventType = "Cms/Entry/RevisionDeleteError" as const;

    getHandlerAbstraction() {
        return EntryRevisionDeleteErrorEventHandler;
    }
}

export const EntryRevisionDeleteErrorEventHandler = createAbstraction<
    IEventHandler<EntryRevisionDeleteErrorEvent>
>("EntryRevisionDeleteErrorEventHandler");

export namespace EntryRevisionDeleteErrorEventHandler {
    export type Interface = IEventHandler<EntryRevisionDeleteErrorEvent>;
    export type Event = EntryRevisionDeleteErrorEvent;
}
