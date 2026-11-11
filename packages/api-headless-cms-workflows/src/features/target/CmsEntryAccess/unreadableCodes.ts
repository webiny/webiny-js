/*
 * The error codes of a model or group the identity cannot read, or that does not exist. Shared by
 * `CmsEntryAccess` and the wrapper use cases that read a model and its group themselves.
 */
export const UNREADABLE_CODES = [
    "Cms/Model/NotFound",
    "Cms/Model/NotAuthorized",
    "Cms/ModelGroup/NotFound",
    "Cms/ModelGroup/NotAuthorized"
];
