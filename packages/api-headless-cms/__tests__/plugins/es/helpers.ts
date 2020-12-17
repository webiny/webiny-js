import { ElasticSearchQueryType } from "@webiny/api-headless-cms/types";

export const createBlankQuery = (): ElasticSearchQueryType => ({
    range: [],
    mustNot: [],
    must: [],
    match: []
});
