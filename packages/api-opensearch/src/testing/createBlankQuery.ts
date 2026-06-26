import type { OpenSearchBoolQueryConfig } from "~/types.js";

export const createBlankQuery = (): OpenSearchBoolQueryConfig => ({
    must_not: [],
    must: [],
    filter: [],
    should: []
});
