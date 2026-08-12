import { BaseError } from "@webiny/feature/api";

/**
 * A screenshot-storage failure, written to be read by whoever triggered the capture.
 *
 * Generic on purpose: the consuming feature (theme extraction, component extraction) wraps or maps it
 * into its own error vocabulary at the boundary, so this package never has to know theirs.
 */
export class CaptureStorageError extends BaseError<{ operation: string; detail: string }> {
    override readonly code = "SiteCapture/StorageError" as const;

    constructor(operation: string, detail: string) {
        super({
            message: `Site capture could not ${operation}: ${detail}.`,
            data: { operation, detail }
        });
    }
}
