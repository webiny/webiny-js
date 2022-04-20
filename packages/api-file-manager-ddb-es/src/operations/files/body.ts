import { FileManagerFilesStorageOperationsListParamsWhere } from "@webiny/api-file-manager/types";
import { decodeCursor } from "@webiny/api-elasticsearch/cursors";
import {
    ElasticsearchBoolQueryConfig,
    SearchBody as ElasticTsSearchBody
} from "@webiny/api-elasticsearch/types";
import { createLimit } from "@webiny/api-elasticsearch/limit";
import { createSort } from "@webiny/api-elasticsearch/sort";
import { normalizeValue } from "@webiny/api-elasticsearch/normalize";
import { FileElasticsearchFieldPlugin } from "~/plugins/FileElasticsearchFieldPlugin";
import { FileElasticsearchSortModifierPlugin } from "~/plugins/FileElasticsearchSortModifierPlugin";
import { FileElasticsearchBodyModifierPlugin } from "~/plugins/FileElasticsearchBodyModifierPlugin";
import { FileElasticsearchQueryModifierPlugin } from "~/plugins/FileElasticsearchQueryModifierPlugin";
import { applyWhere } from "@webiny/api-elasticsearch/where";
import { FileManagerContext } from "~/types";
import { getElasticsearchOperatorPluginsByLocale } from "@webiny/api-elasticsearch/operators";

interface CreateElasticsearchBodyParams {
    context: FileManagerContext;
    where: FileManagerFilesStorageOperationsListParamsWhere;
    limit: number;
    after?: string | null;
    sort: string[];
}

const createElasticsearchQuery = (
    params: CreateElasticsearchBodyParams & {
        plugins: Record<string, FileElasticsearchFieldPlugin>;
    }
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
    const operatorPlugins = getElasticsearchOperatorPluginsByLocale(
        context.plugins,
        initialWhere.locale
    );

    const where: Partial<FileManagerFilesStorageOperationsListParamsWhere> = {
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
    }
    /**
     * Remove so it is not applied again later.
     * Possibly tenant is not defined, but just in case, remove it.
     *
     * cast as any because TS is complaining about deleting non-optional property
     */
    delete where.tenant;
    /**
     * If there is a search value passed in where, it is treated a bit differently.
     * The search value is pushed to search in file name and file tags, where for tags.
     * For tags, the search value is split by space.
     * It produces something like "AND (name contains search value OR tags contains 'search words')"
     */
    if (where.search) {
        const search = normalizeValue(where.search).replace(/^\*/, "").replace(/\*$/, "");

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
    }
    /**
     * Remove because this field actually does not exist and Elasticsearch would throw an error.
     */
    delete where.search;
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

export const createElasticsearchBody = (
    params: CreateElasticsearchBodyParams
): ElasticTsSearchBody => {
    const { context, sort: initialSort, limit: initialLimit, after, where } = params;

    const fieldPlugins = context.plugins
        .byType<FileElasticsearchFieldPlugin>(FileElasticsearchFieldPlugin.type)
        .reduce((acc, plugin) => {
            acc[plugin.field] = plugin;
            return acc;
        }, {} as Record<string, FileElasticsearchFieldPlugin>);

    const limit = createLimit(initialLimit, 100);

    const query = createElasticsearchQuery({
        ...params,
        plugins: fieldPlugins
    });

    const sort = createSort({
        sort: initialSort,
        fieldPlugins
    });

    const queryModifiers = context.plugins.byType<FileElasticsearchQueryModifierPlugin>(
        FileElasticsearchQueryModifierPlugin.type
    );
    for (const plugin of queryModifiers) {
        plugin.modifyQuery({
            query,
            where
        });
    }

    const sortModifiers = context.plugins.byType<FileElasticsearchSortModifierPlugin>(
        FileElasticsearchSortModifierPlugin.type
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

    const bodyModifiers = context.plugins.byType<FileElasticsearchBodyModifierPlugin>(
        FileElasticsearchBodyModifierPlugin.type
    );
    for (const plugin of bodyModifiers) {
        plugin.modifyBody({
            body
        });
    }

    return body;
};
