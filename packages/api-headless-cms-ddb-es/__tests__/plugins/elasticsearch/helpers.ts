import { ElasticsearchQuery } from "../../../src/types";

export const createBlankQuery = (): ElasticsearchQuery => ({
    mustNot: [],
    must: [],
    match: [],
    should: []
});
