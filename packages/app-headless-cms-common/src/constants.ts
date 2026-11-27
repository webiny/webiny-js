export const CMS_MODEL_SINGLETON_TAG = "singleEntry";
export const CMS_MODEL_PUBLISHING_ENABLED_TAG = "$publishing:true";
export const CMS_MODEL_PUBLISHING_DISABLED_TAG = "$publishing:false";

/**
 * Endings of model API names that would interfere with GraphQL schema creation. Case-sensitive.
 * Keep in sync with `disallowedEnding` in
 * `@webiny/api-headless-cms/src/domain/contentModel/validation/isModelEndingAllowed.ts`.
 */
export const CMS_MODEL_DISALLOWED_API_NAME_ENDINGS: string[] = [
    "Response",
    "List",
    "Meta",
    "Input",
    "Sorter",
    "RefType"
];
