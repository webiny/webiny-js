import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";

export const createBlankQuery = (): ElasticsearchBoolQueryConfig => ({
    must_not: [],
    must: [],
    filter: [],
    should: []
});
