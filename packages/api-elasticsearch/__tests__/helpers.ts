import { ElasticsearchBoolQueryConfig } from "../src/types";
import { createElasticsearchClient } from "@webiny/project-utils/testing/elasticsearch/createClient";

export const createBlankQuery = (): ElasticsearchBoolQueryConfig => ({
    must_not: [],
    must: [],
    filter: [],
    should: []
});

export { createElasticsearchClient };
