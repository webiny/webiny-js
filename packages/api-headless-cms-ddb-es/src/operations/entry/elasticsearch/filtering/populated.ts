import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";

export const getPopulated = (
    query: ElasticsearchBoolQueryConfig
): Partial<ElasticsearchBoolQueryConfig> => {
    const result: Partial<ElasticsearchBoolQueryConfig> = {};
    let key: keyof ElasticsearchBoolQueryConfig;
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
