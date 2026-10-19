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

export class KeyValueInvalidCollectionError extends BaseError {
    override readonly code = "KeyValueStore/InvalidCollection" as const;

    constructor() {
        super({
            message: "A collection name must be a non-empty string."
        });
    }
}
