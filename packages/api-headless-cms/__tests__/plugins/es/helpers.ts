import { ElasticsearchQuery } from "@webiny/api-headless-cms/types";

export const createBlankQuery = (): ElasticsearchQuery => ({
    mustNot: [],
    must: [],
    match: [],
    should: []
});
