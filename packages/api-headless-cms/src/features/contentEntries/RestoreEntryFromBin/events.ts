import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type {
    EntryBeforeRestoreFromBinPayload,
    EntryAfterRestoreFromBinPayload,
    EntryRestoreFromBinErrorPayload
} from "./abstractions.js";

/**
 * Before restore entry from bin event
 */
export class EntryBeforeRestoreFromBinEvent extends DomainEvent<EntryBeforeRestoreFromBinPayload> {
    eventType = "entry.beforeRestoreFromBin" as const;

    getHandlerAbstraction() {
        return EntryBeforeRestoreFromBinHandler;
    }
}

export const EntryBeforeRestoreFromBinHandler =
    createAbstraction<IEventHandler<EntryBeforeRestoreFromBinEvent>>(
        "EntryBeforeRestoreFromBinHandler"
    );

export namespace EntryBeforeRestoreFromBinHandler {
    export type Interface = IEventHandler<EntryBeforeRestoreFromBinEvent>;
    export type Event = EntryBeforeRestoreFromBinEvent;
}

/**
 * After restore entry from bin event
 */
export class EntryAfterRestoreFromBinEvent extends DomainEvent<EntryAfterRestoreFromBinPayload> {
    eventType = "entry.afterRestoreFromBin" as const;

    getHandlerAbstraction() {
        return EntryAfterRestoreFromBinHandler;
    }
}

export const EntryAfterRestoreFromBinHandler =
    createAbstraction<IEventHandler<EntryAfterRestoreFromBinEvent>>(
        "EntryAfterRestoreFromBinHandler"
    );

export namespace EntryAfterRestoreFromBinHandler {
    export type Interface = IEventHandler<EntryAfterRestoreFromBinEvent>;
    export type Event = EntryAfterRestoreFromBinEvent;
}

/**
 * Restore entry from bin error event
 */
export class EntryRestoreFromBinErrorEvent extends DomainEvent<EntryRestoreFromBinErrorPayload> {
    eventType = "entry.restoreFromBinError" as const;

    getHandlerAbstraction() {
        return EntryRestoreFromBinErrorHandler;
    }
}

export const EntryRestoreFromBinErrorHandler =
    createAbstraction<IEventHandler<EntryRestoreFromBinErrorEvent>>(
        "EntryRestoreFromBinErrorHandler"
    );

export namespace EntryRestoreFromBinErrorHandler {
    export type Interface = IEventHandler<EntryRestoreFromBinErrorEvent>;
    export type Event = EntryRestoreFromBinErrorEvent;
}
