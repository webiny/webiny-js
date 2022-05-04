import WebinyError from "@webiny/error";
import { SearchBody as esSearchBody } from "elastic-ts";
import { decodeCursor } from "@webiny/api-elasticsearch/cursors";
import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";
import { PageStorageOperationsListWhere } from "@webiny/api-page-builder/types";
import { createSort } from "@webiny/api-elasticsearch/sort";
import { createLimit } from "@webiny/api-elasticsearch/limit";
import { ElasticsearchFieldPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchFieldPlugin";
import { PageElasticsearchFieldPlugin } from "~/plugins/definitions/PageElasticsearchFieldPlugin";
import { PageElasticsearchSortModifierPlugin } from "~/plugins/definitions/PageElasticsearchSortModifierPlugin";
import { PageElasticsearchQueryModifierPlugin } from "~/plugins/definitions/PageElasticsearchQueryModifierPlugin";
import { PageElasticsearchBodyModifierPlugin } from "~/plugins/definitions/PageElasticsearchBodyModifierPlugin";
import { applyWhere } from "@webiny/api-elasticsearch/where";
import { PluginsContainer } from "@webiny/plugins";
import { getElasticsearchOperatorPluginsByLocale } from "@webiny/api-elasticsearch/operators";

interface CreateElasticsearchQueryArgs {
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
    const { where } = args;

    const query: ElasticsearchBoolQueryConfig = {
        must: [],
        must_not: [],
        should: [],
        filter: []
    };

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
    plugins: PluginsContainer;
    where: PageStorageOperationsListWhere;
    limit: number;
    after: string | null;
    sort: string[];
}

const createElasticsearchQuery = (
    params: CreateElasticsearchBodyParams & {
        fieldPlugins: Record<string, ElasticsearchFieldPlugin>;
    }
) => {
    const { plugins, where: initialWhere, fieldPlugins } = params;
    const query = createInitialQueryValue({
        where: initialWhere
    });
    /**
     * Be aware that, if having more registered operator plugins of same type, the last one will be used.
     */
    const operatorPlugins = getElasticsearchOperatorPluginsByLocale(plugins, initialWhere.locale);

    const where: Partial<PageStorageOperationsListWhere> = {
        ...initialWhere
    };
    /**
     * Tags are specific so extract them and remove from where.
     */
    const { tags_in: tags, tags_rule: tagsRule } = initialWhere;
    delete where["tags_in"];
    delete where["tags_rule"];
    if (tags && Array.isArray(tags) === true && tags.length > 0) {
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
        const tenant = initialWhere.tenant;
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

export const createElasticsearchQueryBody = (
    params: CreateElasticsearchBodyParams
): esSearchBody & Pick<Required<esSearchBody>, "sort"> => {
    const { plugins, where, limit: initialLimit, sort: initialSort, after } = params;

    const fieldPlugins = plugins
        .byType<PageElasticsearchFieldPlugin>(PageElasticsearchFieldPlugin.type)
        .reduce((acc, plugin) => {
            acc[plugin.field] = plugin;
            return acc;
        }, {} as Record<string, PageElasticsearchFieldPlugin>);

    const limit = createLimit(initialLimit, 100);

    const query = createElasticsearchQuery({
        ...params,
        fieldPlugins
    });

    const sort = createSort({
        sort: initialSort,
        fieldPlugins
    });

    const queryModifiers = plugins.byType<PageElasticsearchQueryModifierPlugin>(
        PageElasticsearchQueryModifierPlugin.type
    );
    for (const plugin of queryModifiers) {
        plugin.modifyQuery({
            query,
            where
        });
    }

    const sortModifiers = plugins.byType<PageElasticsearchSortModifierPlugin>(
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

    const bodyModifiers = plugins.byType<PageElasticsearchBodyModifierPlugin>(
        PageElasticsearchBodyModifierPlugin.type
    );
    for (const plugin of bodyModifiers) {
        plugin.modifyBody({
            body
        });
    }

    return body;
};
