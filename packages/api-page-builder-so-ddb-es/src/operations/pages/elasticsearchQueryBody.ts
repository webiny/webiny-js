import WebinyError from "@webiny/error";
import { SearchBody as esSearchBody } from "elastic-ts";
import { decodeCursor } from "@webiny/api-elasticsearch/cursors";
import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";
import { PageStorageOperationsListWhere, PbContext } from "@webiny/api-page-builder/types";
import { createSort } from "@webiny/api-elasticsearch/sort";
import { createLimit } from "@webiny/api-elasticsearch/limit";
import { ElasticsearchFieldPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchFieldPlugin";
import { ElasticsearchQueryBuilderOperatorPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchQueryBuilderOperatorPlugin";
import { PageElasticsearchFieldPlugin } from "~/plugins/definitions/PageElasticsearchFieldPlugin";
import { PageElasticsearchSortModifierPlugin } from "~/plugins/definitions/PageElasticsearchSortModifierPlugin";
import { PageElasticsearchQueryModifierPlugin } from "~/plugins/definitions/PageElasticsearchQueryModifierPlugin";
import { PageElasticsearchBodyModifierPlugin } from "~/plugins/definitions/PageElasticsearchBodyModifierPlugin";
import { applyWhere } from "@webiny/api-elasticsearch/where";

interface CreateElasticsearchQueryArgs {
    context: PbContext;
    where: PageStorageOperationsListWhere;
}

/**
 * Latest and published are specific in Elasticsearch to that extend that they are tagged in the published or latest property.
 * We allow either published or either latest.
 * Latest is used in the manage API and published in the read API.
 */
const createInitialQueryValue = (
    args: CreateElasticsearchQueryArgs
): ElasticsearchBoolQueryConfig => {
    const { where, context } = args;

    const query: ElasticsearchBoolQueryConfig = {
        must: [],
        must_not: [],
        should: [],
        filter: []
    };

    /**
     * When ES index is shared between tenants, we need to filter records by tenant ID
     */
    const sharedIndex = process.env.ELASTICSEARCH_SHARED_INDEXES === "true";
    if (sharedIndex) {
        const tenant = context.tenancy.getCurrentTenant();
        query.must.push({ term: { "tenant.keyword": tenant.id } });
    }
    /**
     * We must transform published and latest where args into something that is understandable by our Elasticsearch
     */
    if (where.published === true) {
        query.must.push({
            term: {
                published: true
            }
        });
    } else if (where.latest === true) {
        query.must.push({
            term: {
                latest: true
            }
        });
    }
    // we do not allow not published and not latest
    else if (where.published === false) {
        throw new WebinyError(
            `Cannot call Elasticsearch query with "published" set at false.`,
            "ELASTICSEARCH_UNSUPPORTED_QUERY",
            {
                where
            }
        );
    } else if (where.latest === false) {
        throw new WebinyError(
            `Cannot call Elasticsearch query with "latest" set at false.`,
            "ELASTICSEARCH_UNSUPPORTED_QUERY",
            {
                where
            }
        );
    }
    delete where.published;
    delete where.latest;
    //
    return query;
};

interface CreateElasticsearchBodyParams {
    context: PbContext;
    where: PageStorageOperationsListWhere;
    limit: number;
    after?: string;
    sort: string[];
}

const createElasticsearchQuery = (
    params: CreateElasticsearchBodyParams & { plugins: Record<string, ElasticsearchFieldPlugin> }
) => {
    const { context, where: initialWhere, plugins: fieldPlugins } = params;
    const query = createInitialQueryValue({
        context,
        where: initialWhere
    });
    /**
     * Be aware that, if having more registered operator plugins of same type, the last one will be used.
     */
    const operatorPlugins: Record<string, ElasticsearchQueryBuilderOperatorPlugin> = context.plugins
        .byType<ElasticsearchQueryBuilderOperatorPlugin>(
            ElasticsearchQueryBuilderOperatorPlugin.type
        )
        .reduce((acc, plugin) => {
            acc[plugin.getOperator()] = plugin;
            return acc;
        }, {});

    const where: PageStorageOperationsListWhere = {
        ...initialWhere
    };
    /**
     * Tags are specific so extract them and remove from where.
     */
    const { tags_in: tags, tags_rule: tagsRule } = where;
    delete where["tags_in"];
    delete where["tags_rule"];
    if (Array.isArray(tags) === true && tags.length > 0) {
        if (tagsRule === "any") {
            query.filter.push({
                terms: {
                    "tags.keyword": tags
                }
            });
        } else {
            query.filter.push({
                bool: {
                    must: tags.map(tag => {
                        return {
                            term: {
                                "tags.keyword": tag
                            }
                        };
                    })
                }
            });
        }
    }
    /**
     * Specific search parameter
     */
    if (where.search) {
        query.must.push({
            query_string: {
                query: `*${where.search}*`,
                allow_leading_wildcard: true,
                fields: ["titleLC", "snippet"]
            }
        });
    }
    delete where.search;

    /**
     * !!! IMPORTANT !!! There are few specific cases where we hardcode the query conditions.
     *
     * When ES index is shared between tenants, we need to filter records by tenant ID.
     */
    const sharedIndex = process.env.ELASTICSEARCH_SHARED_INDEXES === "true";
    if (sharedIndex) {
        const tenant = where["tenant"] || context.tenancy.getCurrentTenant().id;
        query.must.push({ term: { "tenant.keyword": tenant } });
        /**
         * Remove so it is not applied again later.
         * Possibly tenant is not defined, but just in case, remove it.
         */
        delete where["tenant"];
    }
    /**
     * We apply other conditions as they are passed via the where value.
     */
    applyWhere({
        query,
        where,
        fields: fieldPlugins,
        operators: operatorPlugins
    });

    return query;
};

interface CreateElasticsearchBodyParams {
    context: PbContext;
    where: PageStorageOperationsListWhere;
    limit: number;
    after?: string;
    sort: string[];
}

export const createElasticsearchQueryBody = (
    params: CreateElasticsearchBodyParams
): esSearchBody => {
    const { context, where, limit: initialLimit, sort: initialSort, after } = params;

    const fieldPlugins: Record<string, PageElasticsearchFieldPlugin> = context.plugins
        .byType<PageElasticsearchFieldPlugin>(PageElasticsearchFieldPlugin.type)
        .reduce((acc, plugin) => {
            acc[plugin.field] = plugin;
            return acc;
        }, {});

    const limit = createLimit(initialLimit, 100);

    const query = createElasticsearchQuery({
        ...params,
        plugins: fieldPlugins
    });

    const sort = createSort({
        sort: initialSort,
        fieldPlugins
    });

    const queryModifiers = context.plugins.byType<PageElasticsearchQueryModifierPlugin>(
        PageElasticsearchQueryModifierPlugin.type
    );
    for (const plugin of queryModifiers) {
        plugin.modifyQuery({
            query,
            where
        });
    }

    const sortModifiers = context.plugins.byType<PageElasticsearchSortModifierPlugin>(
        PageElasticsearchSortModifierPlugin.type
    );
    for (const plugin of sortModifiers) {
        plugin.modifySort({
            sort
        });
    }

    const body = {
        query: {
            constant_score: {
                filter: {
                    bool: {
                        ...query
                    }
                }
            }
        },
        size: limit + 1,
        /**
         * Casting as any is required due to search_after is accepting an array of values.
         * Which is correct in some cases. In our case, it is not.
         * https://www.elastic.co/guide/en/elasticsearch/reference/7.13/paginate-search-results.html
         */
        search_after: decodeCursor(after) as any,
        sort
    };

    const bodyModifiers = context.plugins.byType<PageElasticsearchBodyModifierPlugin>(
        PageElasticsearchBodyModifierPlugin.type
    );
    for (const plugin of bodyModifiers) {
        plugin.modifyBody({
            body
        });
    }

    return body;
};
