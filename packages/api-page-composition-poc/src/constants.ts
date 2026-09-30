/** The on-demand task that composes a run's pages. Not a pipeline stage — Assemble stays the end. */
export const COMPOSE_PAGES_TASK_ID = "pageCompositionPocComposePages";

/**
 * The source-URL → page-slug map, on the tenant key-value store rather than on the extraction run's
 * CMS model. The run entity belongs to the pipeline; this PoC is a consumer and keeps its own state,
 * so deleting the package leaves no field behind. W10.3 and the discard log read this.
 */
export const pageMapKey = (runId: string): string => `pageCompositionPoc:pageMap:${runId}`;

/**
 * The composed-screenshot record for a run — a LOCAL capture's output, kept apart from the page map.
 *
 * Apart on purpose. A recompose rewrites the page map, and if this lived inside it the previous
 * capture would vanish with it, leaving "no comparison yet" where the truth is "a comparison exists
 * and is now out of date". Held separately, it survives the recompose carrying the compose version it
 * was taken against, which is what lets the admin say stale rather than say nothing.
 */
export const composedCaptureKey = (runId: string): string =>
    `pageCompositionPoc:composedCapture:${runId}`;

/**
 * Blob key for one composed page's screenshot.
 *
 * Under `{runId}/` so the run's cleanup removes it with everything else, and carrying the compose
 * version so a recompose cannot leave the previous version's image sitting at the key the new one
 * would use. That is the capture-key defect already filed, and new code should not reproduce it.
 *
 * The page index guards the slug: two source paths can normalise to the same slug, and a collision
 * would silently serve one page's screenshot for another.
 */
export const composedScreenshotKey = (params: {
    runId: string;
    composeVersion: number;
    index: number;
    path: string;
}): string => {
    const slug =
        params.path
            .replace(/[^a-z0-9]+/gi, "-")
            .replace(/^-+|-+$/g, "")
            .toLowerCase() || "home";
    return `${params.runId}/composed/v${params.composeVersion}/page-${params.index}-${slug}.png`;
};

/**
 * The auth-gated composed-screenshot route. Its own route rather than an extension of the extraction
 * one: this package is a consumer of component extraction, and making the extraction route read this
 * package's storage would invert that. The gating itself is shared — see `serveRunBlob`.
 */
export const COMPOSED_IMAGE_ROUTE = "/_webiny/page-composition-poc/run/:runId/image";

/** How long a harness upload URL stays usable. One screenshot on a slow uplink, not a lasting grant. */
export const UPLOAD_URL_SECONDS = 900;
