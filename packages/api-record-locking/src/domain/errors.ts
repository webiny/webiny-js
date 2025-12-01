import { BaseError } from "@webiny/feature/api";

export class EntryAlreadyLockedError extends BaseError<{ id: string; type: string }> {
    override readonly code = "RecordLocking/Entry/AlreadyLockedError" as const;

    constructor(data: { id: string; type: string }) {
        super({
            message: "Entry is already locked for editing.",
            data
        });
    }
}

export class LockRecordNotFoundError extends BaseError {
    override readonly code = "RecordLocking/LockRecord/NotFoundError" as const;

    constructor() {
        super({
            message: "Lock record not found."
        });
    }
}

export class LockRecordPersistenceError extends BaseError {
    override readonly code = "RecordLocking/LockRecord/PersistenceError" as const;

    constructor(error: Error) {
        super({
            message: error.message
        });
    }
}

export class IdentityMismatchError extends BaseError<{ currentId: string; targetId: string }> {
    override readonly code = "RecordLocking/Identity/MismatchError" as const;

    constructor(data: { currentId: string; targetId: string }) {
        super({
            message: "Identity mismatch - cannot perform action.",
            data
        });
    }
}

export class UnlockEntryError extends BaseError {
    override readonly code = "RecordLocking/Entry/UnlockError" as const;

    constructor(error: Error) {
        super({
            message: `Could not unlock entry: ${error.message}`
        });
    }
}

export class LockEntryError extends BaseError {
    override readonly code = "RecordLocking/Entry/LockError" as const;

    constructor(error: Error) {
        super({
            message: `Could not lock entry: ${error.message}`
        });
    }
}

export class UpdateEntryLockError extends BaseError {
    override readonly code = "RecordLocking/Entry/UpdateLockError" as const;

    constructor(error: Error) {
        super({
            message: `Could not update entry lock: ${error.message}`
        });
    }
}

export class IdentityMissingError extends BaseError {
    override readonly code = "RecordLocking/Identity/MissingError" as const;

    constructor() {
        super({
            message: "Identity is missing."
        });
    }
}

export class EntryNotLockedError extends BaseError<{ id: string; type: string }> {
    override readonly code = "RecordLocking/Entry/NotLockedError" as const;

    constructor(data: { id: string; type: string }) {
        super({
            message: "Entry is not locked.",
            data
        });
    }
}

export class UnlockRequestAlreadySentError extends BaseError<{
    id: string;
    type: string;
    identityId: string;
}> {
    override readonly code = "RecordLocking/Entry/UnlockRequestAlreadySentError" as const;

    constructor(data: { id: string; type: string; identityId: string }) {
        super({
            message: "Unlock request already sent.",
            data
        });
    }
}

export class UnlockEntryRequestError extends BaseError {
    override readonly code = "RecordLocking/Entry/UnlockRequestError" as const;

    constructor(error: Error) {
        super({
            message: `Could not request unlock: ${error.message}`
        });
    }
}
