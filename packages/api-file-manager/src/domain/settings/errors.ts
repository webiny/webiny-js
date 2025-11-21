import { BaseError } from "@webiny/feature/api";

export class SettingsNotFoundError extends BaseError {
    override readonly code = "FileManager/Settings/NotFoundError" as const;

    constructor() {
        super({
            message: "File manager settings not found."
        });
    }
}

export class SettingsUpdateError extends BaseError {
    override readonly code = "FileManager/Settings/UpdateError" as const;

    constructor(error: Error) {
        super({
            message: `Error updating settings: ${error.message}`
        });
    }
}
