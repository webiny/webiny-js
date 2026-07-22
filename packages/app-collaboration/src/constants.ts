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
