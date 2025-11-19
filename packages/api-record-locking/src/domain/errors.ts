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

export class LockRecordNotFoundError extends BaseError<{ id: string }> {
    override readonly code = "RecordLocking/LockRecord/NotFoundError" as const;

    constructor(data: { id: string }) {
        super({
            message: "Lock Record not found.",
            data
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

export class NotSameIdentityError extends BaseError<{ currentId: string; targetId: string }> {
    override readonly code = "RecordLocking/Identity/NotSameError" as const;

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
