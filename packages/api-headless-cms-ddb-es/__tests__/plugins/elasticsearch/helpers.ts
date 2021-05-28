import { ElasticsearchQuery } from "@webiny/api-plugin-elastic-search-client/types";

export const createBlankQuery = (): ElasticsearchQuery => ({
    mustNot: [],
    must: [],
    filter: [],
    should: []
});
