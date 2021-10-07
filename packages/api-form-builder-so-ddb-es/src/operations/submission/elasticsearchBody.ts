import { SearchBody as esSearchBody } from "elastic-ts";
import { decodeCursor } from "@webiny/api-elasticsearch/cursors";
import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";
import { createSort } from "@webiny/api-elasticsearch/sort";
import { createLimit } from "@webiny/api-elasticsearch/limit";
import { ElasticsearchQueryBuilderOperatorPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchQueryBuilderOperatorPlugin";
import { SubmissionElasticsearchFieldPlugin } from "~/plugins/SubmissionElasticsearchFieldPlugin";
import { SubmissionElasticsearchSortModifierPlugin } from "~/plugins/SubmissionElasticsearchSortModifierPlugin";
import { SubmissionElasticsearchBodyModifierPlugin } from "~/plugins/SubmissionElasticsearchBodyModifierPlugin";
import { FormBuilderStorageOperationsListSubmissionsParams } from "@webiny/api-form-builder/types";
import { SubmissionElasticsearchQueryModifierPlugin } from "~/plugins/SubmissionElasticsearchQueryModifierPlugin";
import { PluginsContainer } from "@webiny/plugins";
import { applyWhere } from "@webiny/api-elasticsearch/where";

const createInitialQueryValue = (): ElasticsearchBoolQueryConfig => {
    return {
        must: [
            /**
             * We add the __type filtering in the initial query because it must be applied.
             */
            {
                term: {
                    "__type.keyword": "fb.submission"
                }
            }
        ],
        must_not: [],
        should: [],
        filter: []
    };
};

export const createSubmissionElasticType = (): string => {
    return "fb.submission";
};

interface CreateElasticsearchQueryParams extends CreateElasticsearchBodyParams {
    fieldPlugins: Record<string, SubmissionElasticsearchFieldPlugin>;
}

const createElasticsearchQuery = (params: CreateElasticsearchQueryParams) => {
    const { plugins, where: initialWhere, fieldPlugins } = params;
    const query = createInitialQueryValue();
    /**
     * Be aware that, if having more registered operator plugins of same type, the last one will be used.
     */
    const operatorPlugins: Record<string, ElasticsearchQueryBuilderOperatorPlugin> = plugins
        .byType<ElasticsearchQueryBuilderOperatorPlugin>(
            ElasticsearchQueryBuilderOperatorPlugin.type
        )
        .reduce((acc, plugin) => {
            acc[plugin.getOperator()] = plugin;
            return acc;
        }, {});

    const where: FormBuilderStorageOperationsListSubmissionsParams["where"] = {
        ...initialWhere
    };
    /**
     * !!! IMPORTANT !!! There are few specific cases where we hardcode the query conditions.
     *
     * When ES index is shared between tenants, we need to filter records by tenant ID.
     * No need for the tenant filtering otherwise as each index is for single tenant.
     */
    const sharedIndex = process.env.ELASTICSEARCH_SHARED_INDEXES === "true";
    if (sharedIndex) {
        query.must.push({
            term: {
                "tenant.keyword": where.tenant
            }
        });
    }
    /**
     * Remove tenant so it is not applied again later.
     * Possibly tenant is not defined, but just in case, remove it.
     */
    delete where.tenant;
    /**
     * Add the locale to filtering.
     */
    query.must.push({
        term: {
            "locale.keyword": where.locale
        }
    });
    delete where.locale;
    /**
     * And add the parent (form) to the filtering, if it exists.
     */
    query.must.push({
        term: {
            "form.parent.keyword": where.parent
        }
    });
    delete where.parent;
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
    plugins: PluginsContainer;
    where: FormBuilderStorageOperationsListSubmissionsParams["where"];
    limit: number;
    after?: string;
    sort: string[];
}

export const createElasticsearchBody = (params: CreateElasticsearchBodyParams): esSearchBody => {
    const { plugins, where, limit: initialLimit, sort: initialSort, after } = params;

    const fieldPlugins: Record<string, SubmissionElasticsearchFieldPlugin> = plugins
        .byType<SubmissionElasticsearchFieldPlugin>(SubmissionElasticsearchFieldPlugin.type)
        .reduce((acc, plugin) => {
            acc[plugin.field] = plugin;
            return acc;
        }, {});

    const limit = createLimit(initialLimit, 100);

    const query = createElasticsearchQuery({
        ...params,
        fieldPlugins
    });

    const sort = createSort({
        sort: initialSort,
        fieldPlugins
    });

    const queryModifiers = plugins.byType<SubmissionElasticsearchQueryModifierPlugin>(
        SubmissionElasticsearchQueryModifierPlugin.type
    );

    for (const plugin of queryModifiers) {
        plugin.modifyQuery({
            query,
            where
        });
    }

    const sortModifiers = plugins.byType<SubmissionElasticsearchSortModifierPlugin>(
        SubmissionElasticsearchSortModifierPlugin.type
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

    const bodyModifiers = plugins.byType<SubmissionElasticsearchBodyModifierPlugin>(
        SubmissionElasticsearchBodyModifierPlugin.type
    );

    for (const plugin of bodyModifiers) {
        plugin.modifyBody({
            body
        });
    }

    return body;
};
