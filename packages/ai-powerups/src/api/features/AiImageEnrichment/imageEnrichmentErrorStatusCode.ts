import { EnrichmentFileNotFoundError, EnrichmentNotAnImageError } from "./errors.js";
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
    return 500;
}
