import { createBaseQuery } from "~/operations/entry/elasticsearch/initialQuery";
import type { OpenSearchBoolQueryConfig } from "@webiny/api-opensearch/types.js";

export type { OpenSearchBoolQueryConfig as Query };

export const createQuery = (query: Partial<OpenSearchBoolQueryConfig> = {}) => {
    const initial = createBaseQuery();

    return {
        ...initial,
        ...query
    };
};
