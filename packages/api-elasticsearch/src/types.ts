import { Client } from "@elastic/elasticsearch";
import { BoolQueryConfig as esBoolQueryConfig, Query as esQuery } from "elastic-ts";
import { ContextInterface } from "@webiny/handler/types";
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

/**
 * Definition for arguments of the ElasticsearchQueryBuilderOperatorPlugin.apply method.
 *
 * @see ElasticsearchQueryBuilderOperatorPlugin.apply
 *
 * @category Plugin
 * @category Elasticsearch
 */
export interface ElasticsearchQueryBuilderArgsPlugin<
    T extends ContextInterface = ContextInterface
> {
    path: string;
    value: any;
    context: T;
}
