import { ElasticsearchBoolQueryConfig } from "@webiny/api-plugin-elastic-search-client/types";

export const createBlankQuery = (): ElasticsearchBoolQueryConfig => ({
    must_not: [],
    must: [],
    filter: [],
    should: []
});
