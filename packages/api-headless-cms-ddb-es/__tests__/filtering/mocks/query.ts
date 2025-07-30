import { createBaseQuery } from "~/operations/entry/elasticsearch/initialQuery";
import type { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";

export type { ElasticsearchBoolQueryConfig as Query };

export const createQuery = (query: Partial<ElasticsearchBoolQueryConfig> = {}) => {
    const initial = createBaseQuery();

    return {
        ...initial,
        ...query
    };
};
