import { BaseError } from "@webiny/feature/api";

/** Starting the invalidation task threw instead of returning a failed result. */
export class CdnCacheTriggerError extends BaseError {
    override readonly code = "FileManagerS3/CdnCacheTrigger" as const;

    constructor(error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        super({ message });
    }
}
