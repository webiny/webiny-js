import { FileManagerFilesStorageOperationsListParamsWhere } from "@webiny/api-file-manager/types";
import { decodeCursor, normalizeValue } from "@webiny/api-elasticsearch";
import {
    ElasticsearchBoolQueryConfig,
    SearchBody as ElasticTsSearchBody
} from "@webiny/api-elasticsearch/types";
import {
    createLimit,
    createSort,
    applyWhere,
    getElasticsearchOperatorPluginsByLocale
} from "@webiny/api-elasticsearch";
import { FileElasticsearchFieldPlugin } from "~/plugins/FileElasticsearchFieldPlugin";
import { FileElasticsearchSortModifierPlugin } from "~/plugins/FileElasticsearchSortModifierPlugin";
import { FileElasticsearchBodyModifierPlugin } from "~/plugins/FileElasticsearchBodyModifierPlugin";
import { FileElasticsearchQueryModifierPlugin } from "~/plugins/FileElasticsearchQueryModifierPlugin";
import { PluginsContainer } from "@webiny/plugins";

interface CreateElasticsearchBodyParams {
    plugins: PluginsContainer;
    where: FileManagerFilesStorageOperationsListParamsWhere;
    limit: number;
    after?: string | null;
    sort: string[];
    getTenantId: () => string;
}

const createElasticsearchQuery = (
    params: CreateElasticsearchBodyParams & {
        fieldPlugins: Record<string, FileElasticsearchFieldPlugin>;
    }
) => {
    const { plugins, where: initialWhere, fieldPlugins, getTenantId } = params;
    const query: ElasticsearchBoolQueryConfig = {
        must: [],
        filter: [],
        should: [],
        must_not: []
    };
    /**
     * Be aware that, if having more registered operator plugins of same type, the last one will be used.
     */
    const operatorPlugins = getElasticsearchOperatorPluginsByLocale(plugins, initialWhere.locale);

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
        query.must.push({ term: { "tenant.keyword": getTenantId() } });
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
    const { plugins, sort: initialSort, limit: initialLimit, after, where } = params;

    const fieldPlugins = plugins
        .byType<FileElasticsearchFieldPlugin>(FileElasticsearchFieldPlugin.type)
        .reduce((acc, plugin) => {
            acc[plugin.field] = plugin;
            return acc;
        }, {} as Record<string, FileElasticsearchFieldPlugin>);

    const limit = createLimit(initialLimit, 100);

    const query = createElasticsearchQuery({
        ...params,
        fieldPlugins
    });

    const sort = createSort({
        sort: initialSort,
        fieldPlugins
    });

    const queryModifiers = plugins.byType<FileElasticsearchQueryModifierPlugin>(
        FileElasticsearchQueryModifierPlugin.type
    );
    for (const plugin of queryModifiers) {
        plugin.modifyQuery({
            query,
            where
        });
    }

    const sortModifiers = plugins.byType<FileElasticsearchSortModifierPlugin>(
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

    const bodyModifiers = plugins.byType<FileElasticsearchBodyModifierPlugin>(
        FileElasticsearchBodyModifierPlugin.type
    );

    for (const plugin of bodyModifiers) {
        plugin.modifyBody({
            body
        });
    }

    return body;
};
