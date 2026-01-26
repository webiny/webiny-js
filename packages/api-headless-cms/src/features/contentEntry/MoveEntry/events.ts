import { createAbstraction } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type {
    EntryAfterMoveEventPayload,
    EntryBeforeMoveEventPayload,
    EntryMoveErrorEventPayload
} from "./abstractions.js";

/**
 * Before move entry event
 */
export class EntryBeforeMoveEvent extends DomainEvent<EntryBeforeMoveEventPayload> {
    eventType = "Cms/Entry/BeforeMove" as const;

    getHandlerAbstraction() {
        return EntryBeforeMoveEventHandler;
    }
}

export const EntryBeforeMoveEventHandler = createAbstraction<IEventHandler<EntryBeforeMoveEvent>>(
    "EntryBeforeMoveEventHandler"
);

export namespace EntryBeforeMoveEventHandler {
    export type Interface = IEventHandler<EntryBeforeMoveEvent>;
    export type Event = EntryBeforeMoveEvent;
}

/**
 * After move entry event
 */
export class EntryAfterMoveEvent extends DomainEvent<EntryAfterMoveEventPayload> {
    eventType = "Cms/Entry/AfterMove" as const;

    getHandlerAbstraction() {
        return EntryAfterMoveEventHandler;
    }
}

export const EntryAfterMoveEventHandler = createAbstraction<IEventHandler<EntryAfterMoveEvent>>(
    "EntryAfterMoveEventHandler"
);

export namespace EntryAfterMoveEventHandler {
    export type Interface = IEventHandler<EntryAfterMoveEvent>;
    export type Event = EntryAfterMoveEvent;
}

/**
 * Move entry error event
 */
export class EntryMoveErrorEvent extends DomainEvent<EntryMoveErrorEventPayload> {
    eventType = "Cms/Entry/MoveError" as const;

    getHandlerAbstraction() {
        return EntryMoveErrorEventHandler;
    }
}

export const EntryMoveErrorEventHandler = createAbstraction<IEventHandler<EntryMoveErrorEvent>>(
    "EntryMoveErrorEventHandler"
);

export namespace EntryMoveErrorEventHandler {
    export type Interface = IEventHandler<EntryMoveErrorEvent>;
    export type Event = EntryMoveErrorEvent;
}
