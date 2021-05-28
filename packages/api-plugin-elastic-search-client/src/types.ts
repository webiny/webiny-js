import { Client } from "@elastic/elasticsearch";

export type ElasticSearchClientContext = {
    elasticSearch: Client;
};

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
 * definition for Elasticsearch range keyword.
 *
 * @category Elasticsearch
 */
type ElasticsearchQueryRange = {
    [key: string]: {
        gt?: string | number | Date;
        gte?: string | number | Date;
        lt?: string | number | Date;
        lte?: string | number | Date;
    };
};
/**
 * definition for Elasticsearch query string.
 *
 * @category Elasticsearch
 */
type ElasticsearchQueryQuery = {
    allow_leading_wildcard?: boolean;
    fields: string[];
    query: string;
};
/**
 * definition for Elasticsearch simple query string.
 *
 * @category Elasticsearch
 */
type ElasticsearchQuerySimpleQuery = {
    fields: string[];
    query: string;
};
/**
 * definition for Elasticsearch must keyword.
 *
 * @category Elasticsearch
 */
type ElasticsearchQueryMust = {
    term?: {
        [key: string]: any;
    };
    terms?: {
        [key: string]: any[];
    };
    range?: ElasticsearchQueryRange;
    query_string?: ElasticsearchQueryQuery;
    simple_query_string?: ElasticsearchQuerySimpleQuery;
};
/**
 * definition for Elasticsearch must_not keyword.
 *
 * @category Elasticsearch
 */
type ElasticsearchQueryMustNot = {
    term?: {
        [key: string]: any;
    };
    terms?: {
        [key: string]: any[];
    };
    range?: ElasticsearchQueryRange;
    query_string?: ElasticsearchQueryQuery;
    simple_query_string?: ElasticsearchQuerySimpleQuery;
};

/**
 * definition for Elasticsearch match keyword.
 *
 * @category Elasticsearch
 */
export interface ElasticsearchQueryMatch {
    [key: string]: {
        query: string;
        // OR is default one in ES
        operator?: "AND" | "OR";
    };
}

export interface ElasticsearchSort {
    [key: string]: {
        order: "asc" | "desc";
        unmapped_type?: string;
    };
}

/**
 * definition for Elasticsearch "filter" keyword.
 *
 * @category Elasticsearch
 */
type ElasticsearchQueryFilter = {
    term?: {
        [key: string]: any;
    };
    terms?: {
        [key: string]: any[];
    };
    bool?: ElasticsearchBoolQuery;
};

type ElasticsearchQueryShould = {
    term: {
        [key: string]: any;
    };
};

/**
 * Definition for Elasticsearch query.
 *
 * @category Elasticsearch
 */
export interface ElasticsearchBoolQuery {
    /**
     * "must" part of the query.
     */
    must?: ElasticsearchQueryMust[];
    /**
     * "mustNot" part of the query.
     */
    mustNot?: ElasticsearchQueryMustNot[];
    /**
     * "filter" part of the query.
     */
    filter?: ElasticsearchQueryFilter[];
    /**
     * "should" part of the query.
     */
    should?: ElasticsearchQueryShould[];
}

export interface ElasticsearchQuery {
    [key: string]: any;
}
