import { createAbstraction } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type {
    EntryAfterDuplicateEventPayload,
    EntryBeforeDuplicateEventPayload,
    EntryDuplicateErrorEventPayload
} from "./abstractions.js";

/**
 * Before duplicate entry event
 */
export class EntryBeforeDuplicateEvent extends DomainEvent<EntryBeforeDuplicateEventPayload> {
    eventType = "Cms/Entry/BeforeDuplicate" as const;

    getHandlerAbstraction() {
        return EntryBeforeDuplicateEventHandler;
    }
}

/** Hook into entry lifecycle before an entry is duplicated. */
export const EntryBeforeDuplicateEventHandler = createAbstraction<
    IEventHandler<EntryBeforeDuplicateEvent>
>("EntryBeforeDuplicateEventHandler");

export namespace EntryBeforeDuplicateEventHandler {
    export type Interface = IEventHandler<EntryBeforeDuplicateEvent>;
    export type Event = EntryBeforeDuplicateEvent;
}

/**
 * After duplicate entry event
 */
export class EntryAfterDuplicateEvent extends DomainEvent<EntryAfterDuplicateEventPayload> {
    eventType = "Cms/Entry/AfterDuplicate" as const;

    getHandlerAbstraction() {
        return EntryAfterDuplicateEventHandler;
    }
}

/** Hook into entry lifecycle after an entry is duplicated. */
export const EntryAfterDuplicateEventHandler = createAbstraction<
    IEventHandler<EntryAfterDuplicateEvent>
>("EntryAfterDuplicateEventHandler");

export namespace EntryAfterDuplicateEventHandler {
    export type Interface = IEventHandler<EntryAfterDuplicateEvent>;
    export type Event = EntryAfterDuplicateEvent;
}

/**
 * Duplicate entry error event
 */
export class EntryDuplicateErrorEvent extends DomainEvent<EntryDuplicateErrorEventPayload> {
    eventType = "Cms/Entry/DuplicateError" as const;

    getHandlerAbstraction() {
        return EntryDuplicateErrorEventHandler;
    }
}

export const EntryDuplicateErrorEventHandler = createAbstraction<
    IEventHandler<EntryDuplicateErrorEvent>
>("EntryDuplicateErrorEventHandler");

export namespace EntryDuplicateErrorEventHandler {
    export type Interface = IEventHandler<EntryDuplicateErrorEvent>;
    export type Event = EntryDuplicateErrorEvent;
}
