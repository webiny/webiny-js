import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type {
    EntryBeforeMovePayload,
    EntryAfterMovePayload,
    EntryMoveErrorPayload
} from "./abstractions.js";

/**
 * Before move entry event
 */
export class EntryBeforeMoveEvent extends DomainEvent<EntryBeforeMovePayload> {
    eventType = "entry.beforeMove" as const;

    getHandlerAbstraction() {
        return EntryBeforeMoveHandler;
    }
}

export const EntryBeforeMoveHandler = createAbstraction<IEventHandler<EntryBeforeMoveEvent>>(
    "EntryBeforeMoveHandler"
);

export namespace EntryBeforeMoveHandler {
    export type Interface = IEventHandler<EntryBeforeMoveEvent>;
    export type Event = EntryBeforeMoveEvent;
}

/**
 * After move entry event
 */
export class EntryAfterMoveEvent extends DomainEvent<EntryAfterMovePayload> {
    eventType = "entry.afterMove" as const;

    getHandlerAbstraction() {
        return EntryAfterMoveHandler;
    }
}

export const EntryAfterMoveHandler = createAbstraction<IEventHandler<EntryAfterMoveEvent>>(
    "EntryAfterMoveHandler"
);

export namespace EntryAfterMoveHandler {
    export type Interface = IEventHandler<EntryAfterMoveEvent>;
    export type Event = EntryAfterMoveEvent;
}

/**
 * Move entry error event
 */
export class EntryMoveErrorEvent extends DomainEvent<EntryMoveErrorPayload> {
    eventType = "entry.moveError" as const;

    getHandlerAbstraction() {
        return EntryMoveErrorHandler;
    }
}

export const EntryMoveErrorHandler = createAbstraction<IEventHandler<EntryMoveErrorEvent>>(
    "EntryMoveErrorHandler"
);

export namespace EntryMoveErrorHandler {
    export type Interface = IEventHandler<EntryMoveErrorEvent>;
    export type Event = EntryMoveErrorEvent;
}
