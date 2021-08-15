import { Client } from "@elastic/elasticsearch";
import { BoolQueryConfig as esBoolQueryConfig, Query as esQuery } from "elastic-ts";
import { ContextInterface } from "@webiny/handler/types";
export * from "elastic-ts";

export interface ElasticsearchContext extends ContextInterface {
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
export interface ElasticsearchQueryBuilderArgsPlugin<
    T extends ContextInterface = ContextInterface
> {
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
    /**
     * Context we are working in.
     */
    context: T;
}

/**
 * Definition for the ElasticsearchQueryModifierPlugin parameters.
 */
export interface ElasticsearchQueryModifierPluginParams<
    T extends ContextInterface = ContextInterface
> {
    /**
     * Context we are working in.
     */
    context: T;
}
