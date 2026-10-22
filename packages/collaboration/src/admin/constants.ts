/**
 * Content type for CMS entries. Must match the server-side CmsLocatorResolver.
 */
export const CONTENT_TYPE_CMS_ENTRY = "cms.entry";

/**
 * Composes the opaque collaboration contentId for a CMS entry (`<modelId>:<entryId>`), matching
 * how the server-side CmsLocatorResolver parses it.
 */
export const cmsContentId = (modelId: string, entryId: string): string => {
    return `${modelId}:${entryId}`;
};

/**
 * URL query params carrying a deep-link to a specific comment thread on an entry: "when this
 * editor loads, open the comments panel and highlight `commentThread` (optionally scrolling to
 * `commentField`)". Set by any feature that links to a comment (notifications, a copied thread
 * link) and consumed once by the CMS side, which then strips them from the URL. Living on the URL
 * (instead of sessionStorage) makes such links shareable and reproducible.
 */
export const COLLAB_THREAD_PARAM = "commentThread";
export const COLLAB_FIELD_PARAM = "commentField";
