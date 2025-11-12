import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type {
    EntryBeforeDeleteMultiplePayload,
    EntryAfterDeleteMultiplePayload,
    EntryDeleteMultipleErrorPayload
} from "./abstractions.js";

/**
 * Before delete multiple entries event
 */
export class EntryBeforeDeleteMultipleEvent extends DomainEvent<EntryBeforeDeleteMultiplePayload> {
    eventType = "Cms/Entry/BeforeDeleteMultiple" as const;

    getHandlerAbstraction() {
        return EntryBeforeDeleteMultipleHandler;
    }
}

export const EntryBeforeDeleteMultipleHandler = createAbstraction<
    IEventHandler<EntryBeforeDeleteMultipleEvent>
>("EntryBeforeDeleteMultipleHandler");

export namespace EntryBeforeDeleteMultipleHandler {
    export type Interface = IEventHandler<EntryBeforeDeleteMultipleEvent>;
    export type Event = EntryBeforeDeleteMultipleEvent;
}

/**
 * After delete multiple entries event
 */
export class EntryAfterDeleteMultipleEvent extends DomainEvent<EntryAfterDeleteMultiplePayload> {
    eventType = "Cms/Entry/AfterDeleteMultiple" as const;

    getHandlerAbstraction() {
        return EntryAfterDeleteMultipleHandler;
    }
}

export const EntryAfterDeleteMultipleHandler = createAbstraction<
    IEventHandler<EntryAfterDeleteMultipleEvent>
>("EntryAfterDeleteMultipleHandler");

export namespace EntryAfterDeleteMultipleHandler {
    export type Interface = IEventHandler<EntryAfterDeleteMultipleEvent>;
    export type Event = EntryAfterDeleteMultipleEvent;
}

/**
 * Delete multiple entries error event
 */
export class EntryDeleteMultipleErrorEvent extends DomainEvent<EntryDeleteMultipleErrorPayload> {
    eventType = "Cms/Entry/DeleteMultipleError" as const;

    getHandlerAbstraction() {
        return EntryDeleteMultipleErrorHandler;
    }
}

export const EntryDeleteMultipleErrorHandler = createAbstraction<
    IEventHandler<EntryDeleteMultipleErrorEvent>
>("EntryDeleteMultipleErrorHandler");

export namespace EntryDeleteMultipleErrorHandler {
    export type Interface = IEventHandler<EntryDeleteMultipleErrorEvent>;
    export type Event = EntryDeleteMultipleErrorEvent;
}
