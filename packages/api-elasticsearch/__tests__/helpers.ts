import { ElasticsearchBoolQueryConfig } from "~/types";

export const createBlankQuery = (): ElasticsearchBoolQueryConfig => ({
    must_not: [],
    must: [],
    filter: [],
    should: []
});
