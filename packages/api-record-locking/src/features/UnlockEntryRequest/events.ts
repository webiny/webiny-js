import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { ILockRecord } from "~/domain/LockRecord.js";
import type { LockRecordEntryType } from "~/domain/types.js";

// ============================================================================
// EntryBeforeUnlockRequest Event
// ============================================================================

export interface EntryBeforeUnlockRequestPayload {
    id: string;
    type: LockRecordEntryType;
}

export class EntryBeforeUnlockRequestEvent extends DomainEvent<EntryBeforeUnlockRequestPayload> {
    eventType = "RecordLocking/Entry/BeforeUnlockRequest" as const;

    getHandlerAbstraction() {
        return EntryBeforeUnlockRequestHandler;
    }
}

export const EntryBeforeUnlockRequestHandler = createAbstraction<IEventHandler<EntryBeforeUnlockRequestEvent>>(
    "EntryBeforeUnlockRequestHandler"
);

export namespace EntryBeforeUnlockRequestHandler {
    export type Interface = IEventHandler<EntryBeforeUnlockRequestEvent>;
    export type Event = EntryBeforeUnlockRequestEvent;
}

// ============================================================================
// EntryAfterUnlockRequest Event
// ============================================================================

export interface EntryAfterUnlockRequestPayload {
    id: string;
    type: LockRecordEntryType;
    record: ILockRecord;
}

export class EntryAfterUnlockRequestEvent extends DomainEvent<EntryAfterUnlockRequestPayload> {
    eventType = "RecordLocking/Entry/AfterUnlockRequest" as const;

    getHandlerAbstraction() {
        return EntryAfterUnlockRequestHandler;
    }
}

export const EntryAfterUnlockRequestHandler = createAbstraction<IEventHandler<EntryAfterUnlockRequestEvent>>(
    "EntryAfterUnlockRequestHandler"
);

export namespace EntryAfterUnlockRequestHandler {
    export type Interface = IEventHandler<EntryAfterUnlockRequestEvent>;
    export type Event = EntryAfterUnlockRequestEvent;
}

// ============================================================================
// EntryUnlockRequestError Event
// ============================================================================

export interface EntryUnlockRequestErrorPayload {
    id: string;
    type: LockRecordEntryType;
    error: Error;
}

export class EntryUnlockRequestErrorEvent extends DomainEvent<EntryUnlockRequestErrorPayload> {
    eventType = "RecordLocking/Entry/UnlockRequestError" as const;

    getHandlerAbstraction() {
        return EntryUnlockRequestErrorHandler;
    }
}

export const EntryUnlockRequestErrorHandler = createAbstraction<IEventHandler<EntryUnlockRequestErrorEvent>>(
    "EntryUnlockRequestErrorHandler"
);

export namespace EntryUnlockRequestErrorHandler {
    export type Interface = IEventHandler<EntryUnlockRequestErrorEvent>;
    export type Event = EntryUnlockRequestErrorEvent;
}
