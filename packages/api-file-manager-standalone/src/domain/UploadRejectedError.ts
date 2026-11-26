import { BaseError } from "@webiny/feature/api";

/** An upload the API refuses: a bad or expired token, a size outside the limits, a foreign key. */
export class UploadRejectedError extends BaseError {
    override readonly code = "FileManagerServer/UploadRejected" as const;

    constructor(message: string) {
        super({ message });
    }
}
