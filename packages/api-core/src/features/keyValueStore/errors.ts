import { BaseError } from "@webiny/feature/api";

export class KeyNotFoundError extends BaseError<{ key: string }> {
    override readonly code = "KeyValueStore/KeyNotFound" as const;

    constructor(key: string) {
        super({
            message: `Key "${key}" was not found`,
            data: { key }
        });
    }
}

export class KeyValueStorageError extends BaseError {
    override readonly code = "KeyValueStore/Persistence" as const;

    constructor(error: Error) {
        super({
            message: error.message
        });
    }
}

export class KeyValueInvalidCursorError extends BaseError<{ cursor: string }> {
    override readonly code = "KeyValueStore/InvalidCursor" as const;

    constructor(cursor: string) {
        super({
            message: "The list cursor is not one this store returned.",
            data: { cursor }
        });
    }
}

export class KeyValueInvalidCollectionError extends BaseError<{ maxBytes: number }> {
    override readonly code = "KeyValueStore/InvalidCollection" as const;

    constructor(maxBytes: number) {
        super({
            message: `A collection name must be a non-empty string of at most ${maxBytes} bytes.`,
            data: { maxBytes }
        });
    }
}

export class KeyValueKeyTooLongError extends BaseError<{ key: string; maxBytes: number }> {
    override readonly code = "KeyValueStore/KeyTooLong" as const;

    constructor(key: string, maxBytes: number) {
        super({
            message: `A key in a collection must be at most ${maxBytes} bytes.`,
            data: { key, maxBytes }
        });
    }
}

export class KeyValueConditionFailedError extends BaseError<{ key: string }> {
    override readonly code = "KeyValueStore/ConditionFailed" as const;

    constructor(key: string) {
        super({
            message: `The record "${key}" was not in the state the write required.`,
            data: { key }
        });
    }
}

export class KeyValueInvalidConditionError extends BaseError {
    override readonly code = "KeyValueStore/InvalidCondition" as const;

    constructor() {
        super({
            message: "A write can require `ifNotExists` or `ifValue`, not both."
        });
    }
}
