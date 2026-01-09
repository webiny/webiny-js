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
