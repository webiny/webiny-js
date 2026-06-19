import type { OpenSearchBoolQueryConfig } from "@webiny/api-opensearch/types";

export const createBlankQuery = (): OpenSearchBoolQueryConfig => ({
    must_not: [],
    must: [],
    filter: [],
    should: []
});
