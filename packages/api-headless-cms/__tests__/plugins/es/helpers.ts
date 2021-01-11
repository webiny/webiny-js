import { ElasticSearchQuery } from "@webiny/api-headless-cms/types";

export const createBlankQuery = (): ElasticSearchQuery => ({
    mustNot: [],
    must: [],
    match: [],
    should: []
});
