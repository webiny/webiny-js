import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type {
    EntryRevisionBeforeDeletePayload,
    EntryRevisionAfterDeletePayload,
    EntryRevisionDeleteErrorPayload
} from "./abstractions.js";

/**
 * Before delete revision event
 */
export class EntryRevisionBeforeDeleteEvent extends DomainEvent<EntryRevisionBeforeDeletePayload> {
    eventType = "entryRevision.beforeDelete" as const;

    getHandlerAbstraction() {
        return EntryRevisionBeforeDeleteHandler;
    }
}

export const EntryRevisionBeforeDeleteHandler = createAbstraction<
    IEventHandler<EntryRevisionBeforeDeleteEvent>
>("EntryRevisionBeforeDeleteHandler");

export namespace EntryRevisionBeforeDeleteHandler {
    export type Interface = IEventHandler<EntryRevisionBeforeDeleteEvent>;
    export type Event = EntryRevisionBeforeDeleteEvent;
}

/**
 * After delete revision event
 */
export class EntryRevisionAfterDeleteEvent extends DomainEvent<EntryRevisionAfterDeletePayload> {
    eventType = "entryRevision.afterDelete" as const;

    getHandlerAbstraction() {
        return EntryRevisionAfterDeleteHandler;
    }
}

export const EntryRevisionAfterDeleteHandler = createAbstraction<
    IEventHandler<EntryRevisionAfterDeleteEvent>
>("EntryRevisionAfterDeleteHandler");

export namespace EntryRevisionAfterDeleteHandler {
    export type Interface = IEventHandler<EntryRevisionAfterDeleteEvent>;
    export type Event = EntryRevisionAfterDeleteEvent;
}

/**
 * Delete revision error event
 */
export class EntryRevisionDeleteErrorEvent extends DomainEvent<EntryRevisionDeleteErrorPayload> {
    eventType = "entryRevision.deleteError" as const;

    getHandlerAbstraction() {
        return EntryRevisionDeleteErrorHandler;
    }
}

export const EntryRevisionDeleteErrorHandler = createAbstraction<
    IEventHandler<EntryRevisionDeleteErrorEvent>
>("EntryRevisionDeleteErrorHandler");

export namespace EntryRevisionDeleteErrorHandler {
    export type Interface = IEventHandler<EntryRevisionDeleteErrorEvent>;
    export type Event = EntryRevisionDeleteErrorEvent;
}
