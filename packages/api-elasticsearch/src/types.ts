import { Client } from "@elastic/elasticsearch";
import { ApiResponse } from "@elastic/elasticsearch/lib/Transport";
import { BoolQueryConfig as esBoolQueryConfig, Query as esQuery } from "elastic-ts";
import { Context } from "@webiny/handler/types";
/**
 * Re-export some dep lib types.
 */
export * from "elastic-ts";
export { ApiResponse };

export interface ElasticsearchContext extends Context {
    elasticsearch: Client;
}

/**
 * To simplify our plugins, we say that query contains arrays of objects, not single objects.
 * And that they all are defined as empty arrays at the start.
 */
export interface ElasticsearchBoolQueryConfig extends esBoolQueryConfig {
    must: esQuery[];
    filter: esQuery[];
    should: esQuery[];
    must_not: esQuery[];
}

/**
 * Definitions of possible Elasticsearch operators.
 *
 * @category Elasticsearch
 */
export type ElasticsearchQueryOperator =
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
    | "lte";

/**
 * Definition for arguments of the ElasticsearchQueryBuilderOperatorPlugin.apply method.
 *
 * @see ElasticsearchQueryBuilderOperatorPlugin.apply
 *
 * @category Plugin
 * @category Elasticsearch
 */
export interface ElasticsearchQueryBuilderArgsPlugin {
    /**
     * A full path to the field. Including the ".keyword" if it is added.
     */
    path: string;
    /**
     * A path to the field, plain.
     */
    basePath: string;
    /**
     * Value to apply.
     */
    value: any;
    /**
     * Is path containing the ".keyword"
     */
    keyword: boolean;
}

/**
 * Elasticsearch responses.
 */
export interface ElasticsearchSearchResponseHit<T> {
    _source: T;
    sort: string;
}
export interface ElasticsearchSearchResponseAggregationBucket<T> {
    key: T;
}
export interface ElasticsearchSearchResponse<T = any> {
    body: {
        hits: {
            hits: ElasticsearchSearchResponseHit<T>[];
            total: {
                value: number;
            };
        };
        aggregations: {
            [key: string]: {
                buckets: ElasticsearchSearchResponseAggregationBucket<T>[];
            };
        };
    };
}

export interface ElasticsearchIndexRequestBodyMappingsDynamicTemplate {
    [key: string]: {
        match_mapping_type?: string;
        match?: string;
        unmatch?: string;
        mapping?: {
            type?: "text" | "date" | "binary" | "boolean" | "object" | "ip" | "geo" | string;
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

interface ElasticsearchIndexRequestBodySettings {
    analysis?: {
        [key: string]: any;
    };
    number_of_shards?: number;
    number_of_routing_shards?: number;
    codec?: string;
    routing_partition_size?: number;
    soft_deletes?: {
        enabled?: boolean;
        retention_lease?: {
            period?: string;
        };
    };
    load_fixed_bitset_filters_eagerly?: boolean;
    shard?: {
        check_on_startup?: boolean | "checksum";
    };
    number_of_replicas?: number;
    auto_expand_replicas?: string | "all" | false;
    search?: {
        idle?: {
            after?: string;
        };
    };
    refresh_interval?: string;
    max_result_window?: number;
    max_inner_result_window?: number;
    max_rescore_window?: number;
    max_docvalue_fields_search?: number;
    max_script_fields?: number;
    max_ngram_diff?: number;
    max_shingle_diff?: number;
    max_refresh_listeners?: number;
    analyze?: {
        max_token_count?: number;
    };
    highlight?: {
        max_analyzed_offset?: number;
    };
    max_terms_count?: number;
    max_regex_length?: number;
    query?: {
        default_field?: string;
    };
    routing?: {
        allocation?: {
            enable?: "all" | "primaries" | "new_primaries" | "none";
        };
        rebalance?: {
            enable?: "all" | "primaries" | "new_primaries" | "none";
        };
    };
    gc_deletes?: string;
    default_pipeline?: string;
    final_pipeline?: string;
    hidden?: boolean;
    [key: string]: any;
}

export interface ElasticsearchIndexRequestBody {
    settings?: {
        index?: Partial<ElasticsearchIndexRequestBodySettings>;
    };
    mappings: {
        dynamic_templates?: ElasticsearchIndexRequestBodyMappingsDynamicTemplate[];
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
            filter?: {
                [key: string]: any;
            };
            index_routing?: string;
            is_hidden?: boolean;
            is_write_index?: boolean;
            routing?: string;
            search_routing?: string;
        };
    };
}
