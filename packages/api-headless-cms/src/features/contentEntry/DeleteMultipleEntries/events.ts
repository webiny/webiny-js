import { createAbstraction } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type {
    EntryAfterDeleteMultipleEventPayload,
    EntryBeforeDeleteMultipleEventPayload,
    EntryDeleteMultipleErrorEventPayload
} from "./abstractions.js";

/**
 * Before delete multiple entries event
 */
export class EntryBeforeDeleteMultipleEvent extends DomainEvent<EntryBeforeDeleteMultipleEventPayload> {
    eventType = "Cms/Entry/BeforeDeleteMultiple" as const;

    getHandlerAbstraction() {
        return EntryBeforeDeleteMultipleEventHandler;
    }
}

/** Hook into entry lifecycle before multiple entries are deleted. */
export const EntryBeforeDeleteMultipleEventHandler = createAbstraction<
    IEventHandler<EntryBeforeDeleteMultipleEvent>
>("EntryBeforeDeleteMultipleEventHandler");

export namespace EntryBeforeDeleteMultipleEventHandler {
    export type Interface = IEventHandler<EntryBeforeDeleteMultipleEvent>;
    export type Event = EntryBeforeDeleteMultipleEvent;
}

/**
 * After delete multiple entries event
 */
export class EntryAfterDeleteMultipleEvent extends DomainEvent<EntryAfterDeleteMultipleEventPayload> {
    eventType = "Cms/Entry/AfterDeleteMultiple" as const;

    getHandlerAbstraction() {
        return EntryAfterDeleteMultipleEventHandler;
    }
}

/** Hook into entry lifecycle after multiple entries are deleted. */
export const EntryAfterDeleteMultipleEventHandler = createAbstraction<
    IEventHandler<EntryAfterDeleteMultipleEvent>
>("EntryAfterDeleteMultipleEventHandler");

export namespace EntryAfterDeleteMultipleEventHandler {
    export type Interface = IEventHandler<EntryAfterDeleteMultipleEvent>;
    export type Event = EntryAfterDeleteMultipleEvent;
}

/**
 * Delete multiple entries error event
 */
export class EntryDeleteMultipleErrorEvent extends DomainEvent<EntryDeleteMultipleErrorEventPayload> {
    eventType = "Cms/Entry/DeleteMultipleError" as const;

    getHandlerAbstraction() {
        return EntryDeleteMultipleErrorEventHandler;
    }
}

export const EntryDeleteMultipleErrorEventHandler = createAbstraction<
    IEventHandler<EntryDeleteMultipleErrorEvent>
>("EntryDeleteMultipleErrorEventHandler");

export namespace EntryDeleteMultipleErrorEventHandler {
    export type Interface = IEventHandler<EntryDeleteMultipleErrorEvent>;
    export type Event = EntryDeleteMultipleErrorEvent;
}
