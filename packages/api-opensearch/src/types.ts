import type { Client } from "@opensearch-project/opensearch";
import type {
    QueryContainer as QueryDslQueryContainer,
    BoolQuery as QueryDslBoolQuery
} from "@opensearch-project/opensearch/api/_types/_common.query_dsl";
import type {
    FieldSort as SearchFieldSort,
    SortOrder as SearchSortOrder,
    Sort as SearchSort
} from "@opensearch-project/opensearch/api/_types/_common";
import type {
    Search_RequestBody as SearchRequestBody,
    Search_Response
} from "@opensearch-project/opensearch/api/_core/search";
import type { Indices_Create_RequestBody } from "@opensearch-project/opensearch/api/indices/create";
import type { DynamicTemplate } from "@opensearch-project/opensearch/api/_types/_common.mapping";
import type { Context } from "@webiny/api/types.js";

export type { ApiResponse } from "@opensearch-project/opensearch";

export type { Client };

// ---------------------------------------------------------------------------
// Local type aliases replacing elastic-ts
// ---------------------------------------------------------------------------

/** Replaces elastic-ts PrimitiveValue. Aligns with opensearch FieldValue. */
export type PrimitiveValue = boolean | undefined | number | string;

/** Replaces elastic-ts Query */
export type { QueryDslQueryContainer };

/** Replaces elastic-ts BoolQueryConfig */
export type { QueryDslBoolQuery };

/** Replaces elastic-ts FieldSortOptions */
export type FieldSortOptions = SearchFieldSort;

/** Replaces elastic-ts SortOrder. Narrowed to "asc" | "desc" (excludes "_doc"). */
export type SortOrder = "asc" | "desc";

/** Replaces elastic-ts Sort */
export type { SearchSort as Sort };

/** Single sort entry as an object map. Replaces elastic-ts SortType. */
export type SortType = Record<string, FieldSortOptions>;

/** Replaces elastic-ts SearchBody. Overrides search_after to allow PrimitiveValue[] (null | boolean | string | number). */
export type SearchBody = Omit<SearchRequestBody, "search_after"> & {
    search_after?: PrimitiveValue[];
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export interface OpenSearchContext extends Context {
    /**
     * @deprecated Use `context.opensearch` instead.
     */
    elasticsearch: Client;
    opensearch: Client;
}

// ---------------------------------------------------------------------------
// Bool query with required arrays (our convention)
// ---------------------------------------------------------------------------

export interface OpenSearchBoolQueryConfig extends QueryDslBoolQuery {
    must: QueryDslQueryContainer[];
    filter: QueryDslQueryContainer[];
    should: QueryDslQueryContainer[];
    must_not: QueryDslQueryContainer[];
}

// ---------------------------------------------------------------------------
// Operator plugin types
// ---------------------------------------------------------------------------

export type OpenSearchQueryOperator =
    | "eq"
    | "not"
    | "in"
    | "not_in"
    | "contains"
    | "not_contains"
    | "between"
    | "not_between"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | string;

export interface OpenSearchQueryBuilderArgsPlugin {
    name: string;
    path: string;
    basePath: string;
    value: any;
    keyword: boolean;
}

// ---------------------------------------------------------------------------
// Search response shapes (aligned with @opensearch-project/opensearch v3)
// ---------------------------------------------------------------------------

export type OpenSearchSearchResponseHit = Search_Response["body"]["hits"]["hits"][number];

export interface OpenSearchSearchResponseAggregationBucket {
    key: PrimitiveValue;
    doc_count: number;
}

export type OpenSearchSearchResponseBodyHits = Search_Response["body"]["hits"];

export type OpenSearchSearchResponseBody = Search_Response["body"];

export type OpenSearchSearchResponse = Search_Response;

/**
 * Extract the total count from an opensearch hits response.
 * Handles both `TotalHits` (object with `value`) and plain `number` formats.
 */
export const getTotalCount = (total: OpenSearchSearchResponseBodyHits["total"]): number => {
    if (total === undefined || total === null) {
        return 0;
    }
    if (typeof total === "number") {
        return total;
    }
    return total.value;
};

// ---------------------------------------------------------------------------
// Index request body shapes (re-exported from opensearch package)
// ---------------------------------------------------------------------------

export type OpenSearchIndexRequestBodyMappingsDynamicTemplate = Record<string, DynamicTemplate>;

export type OpenSearchIndexRequestBody = Indices_Create_RequestBody;

// Re-export SearchSortOrder for consumers that need it (including "_doc")
export type { SearchSortOrder };
