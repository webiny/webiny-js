import { BaseError } from "@webiny/feature/api";

export class EntryNotFoundError extends BaseError {
    override readonly code = "ENTRY_NOT_FOUND" as const;

    constructor(id?: string) {
        super({
            message: id ? `Entry "${id}" was not found!` : `Entry was not found!`
        });
    }
}

export class EntryNotAccessibleError extends BaseError {
    override readonly code = "ENTRY_NOT_ACCESSIBLE" as const;

    constructor(id: string) {
        super({
            message: `Entry "${id}" was not found!`
        });
    }
}

export class EntryStorageError extends BaseError {
    override readonly code = "ENTRY_STORAGE_ERROR" as const;

    constructor(error: Error) {
        super({
            message: error.message
        });
    }
}

export class EntryValidationError extends BaseError {
    override readonly code = "ENTRY_VALIDATION_ERROR" as const;

    constructor(message: string) {
        super({
            message
        });
    }
}

export class EntryAlreadyPublishedError extends BaseError {
    override readonly code = "ENTRY_ALREADY_PUBLISHED" as const;

    constructor(id: string) {
        super({
            message: `Entry "${id}" is already published!`
        });
    }
}

export class EntryNotPublishedError extends BaseError {
    override readonly code = "ENTRY_NOT_PUBLISHED" as const;

    constructor(id: string) {
        super({
            message: `Entry "${id}" is not published!`
        });
    }
}

export class EntryInBinError extends BaseError {
    override readonly code = "ENTRY_IN_BIN" as const;

    constructor(id: string) {
        super({
            message: `Entry "${id}" is in bin!`
        });
    }
}

export class EntryNotInBinError extends BaseError {
    override readonly code = "ENTRY_NOT_IN_BIN" as const;

    constructor(id: string) {
        super({
            message: `Entry "${id}" is not in bin!`
        });
    }
}

export class EntryLockedError extends BaseError {
    override readonly code = "CONTENT_ENTRY_LOCKED" as const;

    constructor() {
        super({
            message: `Cannot update entry because it's locked.`
        });
    }
}
