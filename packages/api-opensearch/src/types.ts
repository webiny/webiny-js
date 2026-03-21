import type { Client } from "@opensearch-project/opensearch";
import type {
    QueryDslQueryContainer,
    QueryDslBoolQuery,
    SearchFieldSort,
    SearchSortOrder,
    SearchSort,
    SearchRequest
} from "@opensearch-project/opensearch/api/types";
import type { Context, GenericRecord } from "@webiny/api/types.js";

export type { Client };

// ---------------------------------------------------------------------------
// Local type aliases replacing elastic-ts
// ---------------------------------------------------------------------------

/** Replaces elastic-ts PrimitiveValue */
export type PrimitiveValue = null | number | string | boolean;

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
export type SearchBody = Omit<NonNullable<SearchRequest["body"]>, "search_after"> & {
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
// Search response shapes
// ---------------------------------------------------------------------------

export interface OpenSearchSearchResponseHit<T> {
    _index: string;
    _type: string;
    _id: string;
    _score: number | null;
    _source: T;
    sort: PrimitiveValue[];
}

export interface OpenSearchSearchResponseAggregationBucket<T> {
    key: T;
    doc_count: number;
}

export interface OpenSearchSearchResponseBodyHits<T> {
    hits: OpenSearchSearchResponseHit<T>[];
    total: {
        value: number;
    };
}

export interface OpenSearchSearchResponseBodyAggregations<T> {
    [key: string]: {
        buckets: OpenSearchSearchResponseAggregationBucket<T>[];
    };
}

export interface OpenSearchSearchResponseBody<T> {
    hits: OpenSearchSearchResponseBodyHits<T>;
    aggregations: OpenSearchSearchResponseBodyAggregations<T>;
}

export interface OpenSearchSearchResponse<T = GenericRecord> {
    body: OpenSearchSearchResponseBody<T>;
}

// ---------------------------------------------------------------------------
// Index request body shapes (our own definitions, not from opensearch package)
// ---------------------------------------------------------------------------

export interface OpenSearchIndexRequestBodyMappingsDynamicTemplate {
    [key: string]: {
        path_match?: string;
        path_unmatch?: string;
        match_mapping_type?: string;
        match?: string;
        unmatch?: string;
        mapping?: {
            numeric_detection?: boolean;
            date_detection?: boolean;
            type?: string;
            search_analyzer?: string;
            analyzer?: string;
            fields?: {
                [key: string]:
                    | {
                          type: string;
                          search_analyzer?: string;
                          analyzer?: string;
                          ignore_above?: number;
                          [key: string]: any;
                      }
                    | undefined;
            };
            [key: string]: any;
        };
        [key: string]: any;
    };
}

export interface OpenSearchIndexRequestBody {
    settings?: {
        index?: {
            analysis?: { [key: string]: any };
            number_of_shards?: number;
            number_of_routing_shards?: number;
            codec?: string;
            soft_deletes?: { enabled?: boolean; retention_lease?: { period?: string } };
            number_of_replicas?: number;
            auto_expand_replicas?: string | "all" | false;
            refresh_interval?: string;
            max_result_window?: number;
            max_inner_result_window?: number;
            max_rescore_window?: number;
            max_script_fields?: number;
            max_ngram_diff?: number;
            max_shingle_diff?: number;
            max_terms_count?: number;
            max_regex_length?: number;
            routing?: {
                allocation?: { enable?: "all" | "primaries" | "new_primaries" | "none" };
                rebalance?: { enable?: "all" | "primaries" | "new_primaries" | "none" };
            };
            hidden?: boolean;
            total_fields?: { limit?: number };
            [key: string]: any;
        };
    };
    mappings: {
        numeric_detection?: boolean;
        dynamic_templates?: OpenSearchIndexRequestBodyMappingsDynamicTemplate[];
        properties?: {
            [key: string]: {
                analyzer?: string;
                type?: string;
                normalizer?: string;
                index?: string;
                fields?: {
                    [key: string]: {
                        type: string;
                        ignore_above?: number;
                        search_analyzer?: string;
                        analyzer?: string;
                        [key: string]: any;
                    };
                };
                [key: string]: any;
            };
        };
        [key: string]: any;
    };
    aliases?: {
        [key: string]: {
            filter?: { [key: string]: any };
            index_routing?: string;
            is_hidden?: boolean;
            is_write_index?: boolean;
            routing?: string;
            search_routing?: string;
        };
    };
}

// Re-export SearchSortOrder for consumers that need it (including "_doc")
export type { SearchSortOrder };
