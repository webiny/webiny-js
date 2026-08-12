import { BaseError } from "@webiny/feature/api";

/**
 * Component-extraction errors, each written to be read by whoever triggered the work.
 */

export class ExtractionPersistenceError extends BaseError<{ detail: string }> {
    override readonly code = "ComponentExtraction/PersistenceError" as const;

    constructor(cause: unknown) {
        const detail =
            cause instanceof Error
                ? cause.message
                : typeof cause === "string"
                  ? cause
                  : "unknown error";
        super({ message: `Component extraction storage failed: ${detail}.`, data: { detail } });
    }
}

export class ExtractionNotFoundError extends BaseError<{ id: string }> {
    override readonly code = "ComponentExtraction/NotFound" as const;

    constructor(id: string) {
        super({ message: `Not found: ${id}.`, data: { id } });
    }
}

export class ExtractionValidationError extends BaseError<{ detail: string }> {
    override readonly code = "ComponentExtraction/ValidationError" as const;

    constructor(detail: string) {
        super({ message: `Invalid: ${detail}.`, data: { detail } });
    }
}

export class ExtractionRunInProgressError extends BaseError<{ jobId: string; runId: string }> {
    override readonly code = "ComponentExtraction/RunInProgress" as const;

    constructor(jobId: string, runId: string) {
        super({
            message:
                `A run (${runId}) is already in progress for this job. ` +
                "Component extraction runs one at a time per job — wait for it to finish, or cancel it.",
            data: { jobId, runId }
        });
    }
}

export class ExtractionStorageError extends BaseError<{ operation: string; detail: string }> {
    override readonly code = "ComponentExtraction/StorageError" as const;

    constructor(operation: string, detail: string) {
        super({
            message: `Component extraction could not ${operation}: ${detail}.`,
            data: { operation, detail }
        });
    }
}

export type ExtractionError =
    | ExtractionPersistenceError
    | ExtractionNotFoundError
    | ExtractionValidationError
    | ExtractionRunInProgressError
    | ExtractionStorageError;
