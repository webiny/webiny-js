import {
    FileManagerContext,
    FileManagerFilesStorageOperationsListParamsWhere
} from "@webiny/api-file-manager/types";
import { decodeCursor } from "@webiny/api-elasticsearch/cursors";
import {
    ElasticsearchBoolQueryConfig,
    SearchBody as ElasticTsSearchBody
} from "@webiny/api-elasticsearch/types";
import { ElasticsearchQueryModifierPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchQueryModifierPlugin";
import { ElasticsearchFieldPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchFieldPlugin";
import { ElasticsearchQueryBuilderOperatorPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchQueryBuilderOperatorPlugin";
import { createLimit } from "@webiny/api-elasticsearch/limit";
import { createSort } from "@webiny/api-elasticsearch/sort";
import { normalizeValue } from "@webiny/api-elasticsearch/normalize";
import WebinyError from "@webiny/error";

interface CreateElasticsearchBodyParams {
    context: FileManagerContext;
    where: FileManagerFilesStorageOperationsListParamsWhere;
    limit: number;
    after?: string;
    sort: string[];
}

const parseWhereKeyRegExp = new RegExp(/^([a-zA-Z0-9]+)(_[a-zA-Z0-9_]+)?$/);

const parseWhereKey = (key: string) => {
    const match = key.match(parseWhereKeyRegExp);

    if (!match) {
        throw new Error(`It is not possible to search by key "${key}"`);
    }

    const [, field, operation = "eq"] = match;
    const op = operation.match(/^_/) ? operation.substr(1) : operation;

    if (!field.match(/^([a-zA-Z]+)$/)) {
        throw new Error(`Cannot search by "${field}".`);
    }

    return { field, op };
};

const findFieldPlugin = (
    plugins: Record<string, ElasticsearchFieldPlugin>,
    field: string
): ElasticsearchFieldPlugin => {
    const fieldPlugin = plugins[field] || plugins["*"];
    if (fieldPlugin) {
        return fieldPlugin;
    }
    throw new WebinyError(`Missing plugin for the field "${field}".`, "PLUGIN_ERROR", {
        field
    });
};

const findOperatorPlugin = (
    plugins: Record<string, ElasticsearchQueryBuilderOperatorPlugin>,
    operator: string
): ElasticsearchQueryBuilderOperatorPlugin => {
    const fieldPlugin = plugins[operator];
    if (fieldPlugin) {
        return fieldPlugin;
    }
    throw new WebinyError(`Missing plugin for the operator "${operator}"`, "PLUGIN_ERROR", {
        operator
    });
};

const createElasticsearchQuery = (
    params: CreateElasticsearchBodyParams & { plugins: Record<string, ElasticsearchFieldPlugin> }
) => {
    const { context, where: initialWhere, plugins: fieldPlugins } = params;
    const query: ElasticsearchBoolQueryConfig = {
        must: [],
        filter: [],
        should: [],
        must_not: []
    };
    /**
     * Be aware that, if having more registered operator plugins of same type, the last one will be used.
     */
    const operatorPlugins: Record<
        string,
        ElasticsearchQueryBuilderOperatorPlugin
    > = context.plugins
        .byType<ElasticsearchQueryBuilderOperatorPlugin>(
            ElasticsearchQueryBuilderOperatorPlugin.type
        )
        .reduce((acc, plugin) => {
            acc[plugin.getOperator()] = plugin;
            return acc;
        }, {});

    const where = {
        ...initialWhere
    };
    /**
     * !!! IMPORTANT !!! There are few specific cases where we hardcode the query conditions.
     *
     * When ES index is shared between tenants, we need to filter records by tenant ID.
     */
    const sharedIndex = process.env.ELASTICSEARCH_SHARED_INDEXES === "true";
    if (sharedIndex) {
        const tenant = context.tenancy.getCurrentTenant();
        query.must.push({ term: { "tenant.keyword": tenant.id } });
        /**
         * Remove so it is not applied again later.
         * Possibly tenant is not defined, but just in case, remove it.
         */
        delete where.tenant;
    }
    /**
     * If there is a search value passed in where, it is treated a bit differently.
     * The search value is pushed to search in file name and file tags, where for tags.
     * For tags, the search value is split by space.
     * It produces something like "AND (name contains search value OR tags contains 'search words')"
     */
    if (where.search) {
        const search = normalizeValue(where.search);
        query.must.push({
            bool: {
                should: [
                    {
                        wildcard: {
                            name: `*${search}*`
                        }
                    },
                    {
                        terms: {
                            tags: search.toLowerCase().split(" ")
                        }
                    }
                ]
            }
        });
        /**
         * Remove because this field actually does not exist and Elasticsearch would throw an error.
         */
        delete where.search;
    }
    /**
     * We apply other conditions as they are passed via the where value.
     */
    for (const key in where) {
        if (where.hasOwnProperty(key) === false) {
            continue;
        }
        const initialValue = where[key];
        /**
         * There is a possibility that undefined is sent as a value, so just skip it.
         */
        if (initialValue === undefined) {
            continue;
        }
        const { field, op } = parseWhereKey(key);
        const fieldPlugin = findFieldPlugin(fieldPlugins, field);
        const operatorPlugin = findOperatorPlugin(operatorPlugins, op);

        /**
         * Get the path but in the case of * (all fields, replace * with the field.
         * Custom path would return its own value anyways.
         */
        const path = fieldPlugin.getPath(field);
        const basePath = fieldPlugin.getBasePath(field);
        /**
         * Transform the value for the search.
         */
        const value = fieldPlugin.toSearchValue({
            context,
            value: initialValue,
            path,
            basePath
        });

        operatorPlugin.apply(query, {
            context,
            value,
            path,
            basePath: basePath,
            keyword: fieldPlugin.keyword
        });
    }

    return query;
};

export const createElasticsearchBody = (
    params: CreateElasticsearchBodyParams
): ElasticTsSearchBody => {
    const { context, where, sort, limit: initialLimit, after } = params;

    const fieldPlugins: Record<string, ElasticsearchFieldPlugin> = context.plugins
        .byType<ElasticsearchFieldPlugin>(ElasticsearchFieldPlugin.type)
        .filter(plugin => {
            return plugin.entity === "FilesElasticsearch";
        })
        .reduce((acc, plugin) => {
            acc[plugin.field] = plugin;
            return acc;
        }, {});

    const limit = createLimit(initialLimit, 100);

    const query = createElasticsearchQuery({
        ...params,
        plugins: fieldPlugins
    });

    const queryModifierPlugins = context.plugins.byType<ElasticsearchQueryModifierPlugin>(
        ElasticsearchQueryModifierPlugin.type
    );
    for (const pl of queryModifierPlugins) {
        pl.apply({
            context,
            query,
            where,
            sort,
            limit,
            after
        });
    }

    const searchAfter = decodeCursor(after);
    return {
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
        search_after: searchAfter as any,
        sort: createSort({
            context,
            sort,
            plugins: fieldPlugins
        })
    };
};
