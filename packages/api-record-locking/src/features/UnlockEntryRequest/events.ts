import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
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
        return EntryBeforeUnlockRequestEventHandler;
    }
}

export const EntryBeforeUnlockRequestEventHandler = createAbstraction<
    IEventHandler<EntryBeforeUnlockRequestEvent>
>("EntryBeforeUnlockRequestEventHandler");

export namespace EntryBeforeUnlockRequestEventHandler {
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
        return EntryAfterUnlockRequestEventHandler;
    }
}

export const EntryAfterUnlockRequestEventHandler = createAbstraction<
    IEventHandler<EntryAfterUnlockRequestEvent>
>("EntryAfterUnlockRequestEventHandler");

export namespace EntryAfterUnlockRequestEventHandler {
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
        return EntryUnlockRequestErrorEventHandler;
    }
}

export const EntryUnlockRequestErrorEventHandler = createAbstraction<
    IEventHandler<EntryUnlockRequestErrorEvent>
>("EntryUnlockRequestErrorEventHandler");

export namespace EntryUnlockRequestErrorEventHandler {
    export type Interface = IEventHandler<EntryUnlockRequestErrorEvent>;
    export type Event = EntryUnlockRequestErrorEvent;
}
