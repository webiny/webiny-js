/*
 * Shared between the admin and API bundles, deliberately. The API decides where a report goes; the
 * dialog only says so out loud. Two copies of this constant would let the dialog name one
 * repository while the API used another, which is worse than the duplication of a single string.
 */

export const REPOSITORY_PARAM = "BUG_REPORT_REPOSITORY";

/*
 * Where compose mode points when a project configures nothing. Reachable from the composer only:
 * filing refuses to fall back to it, because there a human never sees the issue before it exists.
 */
export const DEFAULT_REPOSITORY = "webiny/webiny-js";
