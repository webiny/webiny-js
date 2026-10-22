import { EnrichmentFileNotFoundError, EnrichmentNotAnImageError } from "./errors.js";
import { EnrichmentCapabilityDisabledError } from "./errors.js";
import type { ImageEnrichmentError } from "./errors.js";

/**
 * Maps an enrichment failure to the HTTP status a transport should answer with. Lives next to the
 * errors rather than in a route, so a second entry point can't invent a different mapping.
 */
export function imageEnrichmentErrorStatusCode(error: ImageEnrichmentError): number {
    if (error instanceof EnrichmentFileNotFoundError) {
        return 404;
    }
    if (error instanceof EnrichmentNotAnImageError) {
        return 400;
    }
    /*
     * The request is fine and the server is fine; the feature is switched off. A 500 would tell
     * whoever called it that something broke, which is the one thing that did not happen.
     */
    if (error instanceof EnrichmentCapabilityDisabledError) {
        return 409;
    }
    return 500;
}
