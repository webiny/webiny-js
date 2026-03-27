import type { ElasticsearchBoolQueryConfig } from "@webiny/api-opensearch/types";

export const createBlankQuery = (): ElasticsearchBoolQueryConfig => ({
    must_not: [],
    must: [],
    filter: [],
    should: []
});
