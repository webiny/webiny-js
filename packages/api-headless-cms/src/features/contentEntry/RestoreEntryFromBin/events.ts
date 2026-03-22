import { createAbstraction } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type {
    EntryAfterRestoreFromBinEventPayload,
    EntryBeforeRestoreFromBinEventPayload,
    EntryRestoreFromBinErrorEventPayload
} from "./abstractions.js";

/**
 * Before restore entry from bin event
 */
export class EntryBeforeRestoreFromBinEvent extends DomainEvent<EntryBeforeRestoreFromBinEventPayload> {
    eventType = "Cms/Entry/BeforeRestoreFromBin" as const;

    getHandlerAbstraction() {
        return EntryBeforeRestoreFromBinEventHandler;
    }
}

/** Hook into entry lifecycle before an entry is restored from bin. */
export const EntryBeforeRestoreFromBinEventHandler = createAbstraction<
    IEventHandler<EntryBeforeRestoreFromBinEvent>
>("EntryBeforeRestoreFromBinEventHandler");

export namespace EntryBeforeRestoreFromBinEventHandler {
    export type Interface = IEventHandler<EntryBeforeRestoreFromBinEvent>;
    export type Event = EntryBeforeRestoreFromBinEvent;
}

/**
 * After restore entry from bin event
 */
export class EntryAfterRestoreFromBinEvent extends DomainEvent<EntryAfterRestoreFromBinEventPayload> {
    eventType = "Cms/Entry/AfterRestoreFromBin" as const;

    getHandlerAbstraction() {
        return EntryAfterRestoreFromBinEventHandler;
    }
}

/** Hook into entry lifecycle after an entry is restored from bin. */
export const EntryAfterRestoreFromBinEventHandler = createAbstraction<
    IEventHandler<EntryAfterRestoreFromBinEvent>
>("EntryAfterRestoreFromBinEventHandler");

export namespace EntryAfterRestoreFromBinEventHandler {
    export type Interface = IEventHandler<EntryAfterRestoreFromBinEvent>;
    export type Event = EntryAfterRestoreFromBinEvent;
}

/**
 * Restore entry from bin error event
 */
export class EntryRestoreFromBinErrorEvent extends DomainEvent<EntryRestoreFromBinErrorEventPayload> {
    eventType = "Cms/Entry/RestoreFromBinError" as const;

    getHandlerAbstraction() {
        return EntryRestoreFromBinErrorEventHandler;
    }
}

export const EntryRestoreFromBinErrorEventHandler = createAbstraction<
    IEventHandler<EntryRestoreFromBinErrorEvent>
>("EntryRestoreFromBinErrorEventHandler");

export namespace EntryRestoreFromBinErrorEventHandler {
    export type Interface = IEventHandler<EntryRestoreFromBinErrorEvent>;
    export type Event = EntryRestoreFromBinErrorEvent;
}
