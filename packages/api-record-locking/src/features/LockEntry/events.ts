import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/EventPublisher";
import type { IEventHandler } from "@webiny/api-core/features/EventPublisher";
import type { ILockRecord } from "~/domain/LockRecord.js";
import type { LockRecordEntryType } from "~/domain/types.js";

// ============================================================================
// EntryBeforeLock Event
// ============================================================================

export interface EntryBeforeLockPayload {
    id: string;
    type: LockRecordEntryType;
}

export class EntryBeforeLockEvent extends DomainEvent<EntryBeforeLockPayload> {
    eventType = "RecordLocking/Entry/BeforeLock" as const;

    getHandlerAbstraction() {
        return EntryBeforeLockHandler;
    }
}

export const EntryBeforeLockHandler =
    createAbstraction<IEventHandler<EntryBeforeLockEvent>>("EntryBeforeLockHandler");

export namespace EntryBeforeLockHandler {
    export type Interface = IEventHandler<EntryBeforeLockEvent>;
    export type Event = EntryBeforeLockEvent;
}

// ============================================================================
// EntryAfterLock Event
// ============================================================================

export interface EntryAfterLockPayload {
    id: string;
    type: LockRecordEntryType;
    record: ILockRecord;
}

export class EntryAfterLockEvent extends DomainEvent<EntryAfterLockPayload> {
    eventType = "RecordLocking/Entry/AfterLock" as const;

    getHandlerAbstraction() {
        return EntryAfterLockHandler;
    }
}

export const EntryAfterLockHandler =
    createAbstraction<IEventHandler<EntryAfterLockEvent>>("EntryAfterLockHandler");

export namespace EntryAfterLockHandler {
    export type Interface = IEventHandler<EntryAfterLockEvent>;
    export type Event = EntryAfterLockEvent;
}

// ============================================================================
// EntryLockError Event
// ============================================================================

export interface EntryLockErrorPayload {
    id: string;
    type: LockRecordEntryType;
    error: Error;
}

export class EntryLockErrorEvent extends DomainEvent<EntryLockErrorPayload> {
    eventType = "RecordLocking/Entry/LockError" as const;

    getHandlerAbstraction() {
        return EntryLockErrorHandler;
    }
}

export const EntryLockErrorHandler =
    createAbstraction<IEventHandler<EntryLockErrorEvent>>("EntryLockErrorHandler");

export namespace EntryLockErrorHandler {
    export type Interface = IEventHandler<EntryLockErrorEvent>;
    export type Event = EntryLockErrorEvent;
}
