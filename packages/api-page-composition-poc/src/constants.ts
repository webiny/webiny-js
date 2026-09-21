/** The on-demand task that composes a run's pages. Not a pipeline stage — Assemble stays the end. */
export const COMPOSE_PAGES_TASK_ID = "pageCompositionPocComposePages";

/**
 * The source-URL → page-slug map, on the tenant key-value store rather than on the extraction run's
 * CMS model. The run entity belongs to the pipeline; this PoC is a consumer and keeps its own state,
 * so deleting the package leaves no field behind. W10.3 and the discard log read this.
 */
export const pageMapKey = (runId: string): string => `pageCompositionPoc:pageMap:${runId}`;
