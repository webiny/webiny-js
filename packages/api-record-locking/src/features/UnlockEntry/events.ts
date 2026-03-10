import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { ILockRecord } from "~/domain/LockRecord.js";
import type { LockRecordEntryType } from "~/domain/types.js";

// ============================================================================
// EntryBeforeUnlock Event
// ============================================================================

export interface EntryBeforeUnlockPayload {
    id: string;
    type: LockRecordEntryType;
    force?: boolean;
}

export class EntryBeforeUnlockEvent extends DomainEvent<EntryBeforeUnlockPayload> {
    eventType = "RecordLocking/Entry/BeforeUnlock" as const;

    getHandlerAbstraction() {
        return EntryBeforeUnlockEventHandler;
    }
}

export const EntryBeforeUnlockEventHandler = createAbstraction<
    IEventHandler<EntryBeforeUnlockEvent>
>("EntryBeforeUnlockEventHandler");

export namespace EntryBeforeUnlockEventHandler {
    export type Interface = IEventHandler<EntryBeforeUnlockEvent>;
    export type Event = EntryBeforeUnlockEvent;
}

// ============================================================================
// EntryAfterUnlock Event
// ============================================================================

export interface EntryAfterUnlockPayload {
    id: string;
    type: LockRecordEntryType;
    record: ILockRecord;
}

export class EntryAfterUnlockEvent extends DomainEvent<EntryAfterUnlockPayload> {
    eventType = "RecordLocking/Entry/AfterUnlock" as const;

    getHandlerAbstraction() {
        return EntryAfterUnlockEventHandler;
    }
}

export const EntryAfterUnlockEventHandler = createAbstraction<IEventHandler<EntryAfterUnlockEvent>>(
    "EntryAfterUnlockEventHandler"
);

export namespace EntryAfterUnlockEventHandler {
    export type Interface = IEventHandler<EntryAfterUnlockEvent>;
    export type Event = EntryAfterUnlockEvent;
}

// ============================================================================
// EntryUnlockError Event
// ============================================================================

export interface EntryUnlockErrorPayload {
    id: string;
    type: LockRecordEntryType;
    error: Error;
}

export class EntryUnlockErrorEvent extends DomainEvent<EntryUnlockErrorPayload> {
    eventType = "RecordLocking/Entry/UnlockError" as const;

    getHandlerAbstraction() {
        return EntryUnlockErrorEventHandler;
    }
}

export const EntryUnlockErrorEventHandler = createAbstraction<IEventHandler<EntryUnlockErrorEvent>>(
    "EntryUnlockErrorEventHandler"
);

export namespace EntryUnlockErrorEventHandler {
    export type Interface = IEventHandler<EntryUnlockErrorEvent>;
    export type Event = EntryUnlockErrorEvent;
}
