import WebinyError from "@webiny/error";
import { SearchBody as esSearchBody } from "elastic-ts";
import { decodeCursor } from "@webiny/api-elasticsearch/cursors";
import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";
import { createSort } from "@webiny/api-elasticsearch/sort";
import { createLimit } from "@webiny/api-elasticsearch/limit";
import { ElasticsearchFieldPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchFieldPlugin";
import { ElasticsearchQueryBuilderOperatorPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchQueryBuilderOperatorPlugin";
import { SubmissionElasticsearchFieldPlugin } from "~/plugins/SubmissionElasticsearchFieldPlugin";
import { SubmissionElasticsearchSortModifierPlugin } from "~/plugins/SubmissionElasticsearchSortModifierPlugin";
import { SubmissionElasticsearchBodyModifierPlugin } from "~/plugins/SubmissionElasticsearchBodyModifierPlugin";
import { FormBuilderStorageOperationsListSubmissionsParams } from "@webiny/api-form-builder/types";
import { SubmissionElasticsearchQueryModifierPlugin } from "~/plugins/SubmissionElasticsearchQueryModifierPlugin";
import { PluginsContainer } from "@webiny/plugins";

const parseWhereKeyRegExp = new RegExp(/^([a-zA-Z0-9]+)(_[a-zA-Z0-9_]+)?$/);
const parseWhereKey = (key: string) => {
    const match = key.match(parseWhereKeyRegExp);

    if (!match) {
        throw new Error(`It is not possible to search by key "${key}"`);
    }

    const [, field, operation = "eq"] = match;
    const op = operation.match(/^_/) ? operation.substr(1) : operation;

    if (!field.match(/^([a-zA-Z]+)$/)) {
        throw new Error(`Cannot filter by "${field}".`);
    }

    return { field, op };
};

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

const findFieldPlugin = (
    plugins: Record<string, ElasticsearchFieldPlugin>,
    field: string
): ElasticsearchFieldPlugin => {
    const plugin = plugins[field] || plugins["*"];
    if (plugin) {
        return plugin;
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

interface CreateElasticsearchQueryParams extends CreateElasticsearchBodyParams {
    fieldPlugins: Record<string, ElasticsearchFieldPlugin>;
}

const createElasticsearchQuery = (params: CreateElasticsearchQueryParams & {}) => {
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
            value: initialValue,
            path,
            basePath
        });

        operatorPlugin.apply(query, {
            value,
            path,
            basePath: basePath,
            keyword: fieldPlugin.keyword
        });
    }

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
