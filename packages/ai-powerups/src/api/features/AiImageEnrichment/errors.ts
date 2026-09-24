/**
 * Errors shared by every image-enrichment entry point (the background task and the streaming HTTP
 * route). Each carries a `code` so callers can map it to their own transport: the task turns them
 * into task results, the route into HTTP status codes.
 */
export class EnrichmentFileNotFoundError extends Error {
    readonly code = "ENRICHMENT_FILE_NOT_FOUND" as const;

    constructor(fileId: string) {
        super(`File not found: ${fileId}`);
    }
}

export class EnrichmentNotAnImageError extends Error {
    readonly code = "ENRICHMENT_NOT_AN_IMAGE" as const;

    constructor(type: string) {
        super(`File is not an image (received "${type}"); skipping AI enrichment.`);
    }
}

export class EnrichmentFileContentsError extends Error {
    readonly code = "ENRICHMENT_FILE_CONTENTS_UNREADABLE" as const;

    constructor(reason: string) {
        super(`Unable to read file contents: ${reason}`);
    }
}

export class EnrichmentNoProviderError extends Error {
    readonly code = "ENRICHMENT_NO_AI_PROVIDER" as const;

    /**
     * The reason comes from capability resolution, which knows which of the several ways this can
     * fail actually happened: no model in the Vision role, a deleted connection, a missing key.
     * Passing it through beats replacing all of them with one generic sentence.
     */
    constructor(reason?: string) {
        super(
            reason ??
                "No AI model is configured for image enrichment. Pick one under Settings → AI Power-Ups → Model roles."
        );
    }
}

export class EnrichmentPersistError extends Error {
    readonly code = "ENRICHMENT_PERSIST_FAILED" as const;

    constructor(reason: string) {
        super(`Failed to update file: ${reason}`);
    }
}

export type ImageEnrichmentError =
    | EnrichmentFileNotFoundError
    | EnrichmentNotAnImageError
    | EnrichmentFileContentsError
    | EnrichmentNoProviderError
    | EnrichmentPersistError;
