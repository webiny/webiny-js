/**
 * This list is to disallow creating models that might interfere with GraphQL schema creation.
 * Add more if required.
 *
 * The admin validates the same endings from `CMS_MODEL_DISALLOWED_API_NAME_ENDINGS` in
 * `@webiny/app-headless-cms-common`. Keep both lists in sync.
 */
export const disallowedEnding: string[] = [
    "Response",
    "List",
    "Meta",
    "Input",
    "Sorter",
    "RefType"
];

export const isModelEndingAllowed = (apiName: string): boolean => {
    for (const ending of disallowedEnding) {
        const re = new RegExp(`${ending}$`);
        const matched = apiName.match(re);
        if (matched === null) {
            continue;
        }
        return false;
    }
    return true;
};
