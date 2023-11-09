import { ElasticsearchBoolQueryConfig } from "../src/types";

export * from "@webiny/project-utils/testing/elasticsearch/createClient";

export const createBlankQuery = (): ElasticsearchBoolQueryConfig => ({
    must_not: [],
    must: [],
    filter: [],
    should: []
});
