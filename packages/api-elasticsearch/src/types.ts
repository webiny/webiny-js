import { Client } from "@elastic/elasticsearch";
import { BoolQueryConfig as esBoolQueryConfig, Query as esQuery } from "elastic-ts";
import { Context } from "@webiny/handler/types";
export * from "elastic-ts";

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
