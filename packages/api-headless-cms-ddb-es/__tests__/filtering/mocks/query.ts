import { createBaseQuery } from "~/operations/entry/elasticsearch/initialQuery";
import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";

export { ElasticsearchBoolQueryConfig as Query };

export const createQuery = (query: Partial<ElasticsearchBoolQueryConfig> = {}) => {
    const initial = createBaseQuery();

    return {
        ...initial,
        ...query
    };
};
