import { BaseError } from "@webiny/feature/api";

export class SettingsNotFoundError extends BaseError {
    override readonly code = "SETTINGS_NOT_FOUND" as const;

    constructor(name: string) {
        super({
            message: `Settings "${name}" was not found!`
        });
    }
}

export class SettingsStorageError extends BaseError {
    override readonly code = "SETTINGS_STORAGE_ERROR" as const;

    constructor(error: Error) {
        super({
            message: error.message
        });
    }
}

export class SettingsValidationError extends BaseError<{ message: string }> {
    override readonly code = "SETTINGS_VALIDATION_ERROR" as const;

    constructor(message: string) {
        super({
            message,
            data: { message }
        });
    }
}
