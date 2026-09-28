/**
 * Image enrichment is switched off in settings. Not a failure: someone chose it, so the upload task
 * finishes as done, the same as for a file that is not an image. Kept apart from
 * `EnrichmentNoProviderError`, which is a real misconfiguration and should stay loud.
 */
export class EnrichmentCapabilityDisabledError extends Error {
    readonly code = "ENRICHMENT_CAPABILITY_DISABLED" as const;

    constructor(reason: string) {
        super(reason);
    }
}
