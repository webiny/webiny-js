import { Client } from "@elastic/elasticsearch";
import { BoolQueryConfig as esBoolQueryConfig, Query as esQuery } from "elastic-ts";
export * from "elastic-ts";

export type ElasticSearchClientContext = {
    elasticSearch: Client;
};

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
