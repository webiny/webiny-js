import type { OpenSearchBoolQueryConfig } from "@webiny/api-opensearch/types.js";

export const getPopulated = (
    query: OpenSearchBoolQueryConfig
): Partial<OpenSearchBoolQueryConfig> => {
    const result: Partial<OpenSearchBoolQueryConfig> = {};
    let key: keyof OpenSearchBoolQueryConfig;
    for (key in query) {
        const value = query[key];
        if (value === undefined || (Array.isArray(value) && value.length === 0)) {
            continue;
        }
        /**
         * TODO figure out better types.
         */
        // @ts-expect-error
        result[key] = value;
    }
    return result;
};
