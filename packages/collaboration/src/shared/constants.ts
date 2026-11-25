export const COLLAB_THREAD_MODEL_ID = "wbyCollabThread";

/**
 * Known content types. The collaboration core is content-agnostic — each content app
 * registers a locator resolver for its own content type. These constants exist only so
 * the built-in integrations agree on a value.
 */
export const CONTENT_TYPE_CMS_ENTRY = "cms.entry";

/**
 * Security: mentions trigger notifications (with the content title and message body) to the
 * mentioned users, so their number and size are capped.
 */
export const MAX_MENTIONS = 20;
export const MAX_MENTION_ID_LENGTH = 128;
