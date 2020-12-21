import { ElasticSearchQueryType } from "@webiny/api-headless-cms/types";

export const createBlankQuery = (): ElasticSearchQueryType => ({
    mustNot: [],
    must: [],
    match: [],
    should: []
});
