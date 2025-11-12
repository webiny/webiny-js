import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type {
    EntryRevisionBeforeCreatePayload,
    EntryRevisionAfterCreatePayload,
    EntryRevisionCreateErrorPayload
} from "./abstractions.js";

/**
 * Before create entry revision event
 */
export class EntryRevisionBeforeCreateEvent extends DomainEvent<EntryRevisionBeforeCreatePayload> {
    eventType = "entry.revision.beforeCreate" as const;

    getHandlerAbstraction() {
        return EntryRevisionBeforeCreateHandler;
    }
}

export const EntryRevisionBeforeCreateHandler =
    createAbstraction<IEventHandler<EntryRevisionBeforeCreateEvent>>(
        "EntryRevisionBeforeCreateHandler"
    );

export namespace EntryRevisionBeforeCreateHandler {
    export type Interface = IEventHandler<EntryRevisionBeforeCreateEvent>;
    export type Event = EntryRevisionBeforeCreateEvent;
}

/**
 * After create entry revision event
 */
export class EntryRevisionAfterCreateEvent extends DomainEvent<EntryRevisionAfterCreatePayload> {
    eventType = "entry.revision.afterCreate" as const;

    getHandlerAbstraction() {
        return EntryRevisionAfterCreateHandler;
    }
}

export const EntryRevisionAfterCreateHandler =
    createAbstraction<IEventHandler<EntryRevisionAfterCreateEvent>>(
        "EntryRevisionAfterCreateHandler"
    );

export namespace EntryRevisionAfterCreateHandler {
    export type Interface = IEventHandler<EntryRevisionAfterCreateEvent>;
    export type Event = EntryRevisionAfterCreateEvent;
}

/**
 * Create entry revision error event
 */
export class EntryRevisionCreateErrorEvent extends DomainEvent<EntryRevisionCreateErrorPayload> {
    eventType = "entry.revision.createError" as const;

    getHandlerAbstraction() {
        return EntryRevisionCreateErrorHandler;
    }
}

export const EntryRevisionCreateErrorHandler =
    createAbstraction<IEventHandler<EntryRevisionCreateErrorEvent>>(
        "EntryRevisionCreateErrorHandler"
    );

export namespace EntryRevisionCreateErrorHandler {
    export type Interface = IEventHandler<EntryRevisionCreateErrorEvent>;
    export type Event = EntryRevisionCreateErrorEvent;
}
