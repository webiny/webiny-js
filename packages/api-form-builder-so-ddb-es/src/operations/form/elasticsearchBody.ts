import { PrimitiveValue, SearchBody as esSearchBody } from "elastic-ts";
import {
    applyWhere,
    createLimit,
    createSort,
    getElasticsearchOperatorPluginsByLocale,
    isSharedElasticsearchIndex
} from "@webiny/api-elasticsearch";
import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";
import { FormElasticsearchFieldPlugin } from "~/plugins/FormElasticsearchFieldPlugin";
import { FormElasticsearchSortModifierPlugin } from "~/plugins/FormElasticsearchSortModifierPlugin";
import { FormElasticsearchBodyModifierPlugin } from "~/plugins/FormElasticsearchBodyModifierPlugin";
import { FormBuilderStorageOperationsListFormsParams } from "@webiny/api-form-builder/types";
import { FormElasticsearchQueryModifierPlugin } from "~/plugins/FormElasticsearchQueryModifierPlugin";
import { PluginsContainer } from "@webiny/plugins";

export const createFormElasticType = (): string => {
    return "fb.form";
};

const createInitialQueryValue = (): ElasticsearchBoolQueryConfig => {
    return {
        must: [
            /**
             * We add the __type filtering in the initial query because it must be applied.
             */
            {
                term: {
                    "__type.keyword": createFormElasticType()
                }
            }
        ],
        must_not: [],
        should: [],
        filter: []
    };
};

interface CreateElasticsearchQueryParams extends CreateElasticsearchBodyParams {
    fieldPlugins: Record<string, FormElasticsearchFieldPlugin>;
}

const createElasticsearchQuery = (params: CreateElasticsearchQueryParams) => {
    const { plugins, where: initialWhere, fieldPlugins } = params;
    const query = createInitialQueryValue();
    /**
     * Be aware that, if having more registered operator plugins of same type, the last one will be used.
     */
    const operatorPlugins = getElasticsearchOperatorPluginsByLocale(plugins, initialWhere.locale);

    const where: Partial<FormBuilderStorageOperationsListFormsParams["where"]> = {
        ...initialWhere
    };
    /**
     * !!! IMPORTANT !!! There are few specific cases where we hardcode the query conditions.
     *
     * When ES index is shared between tenants, we need to filter records by tenant ID.
     * No need for the tenant filtering otherwise as each index is for single tenant.
     */
    const sharedIndex = isSharedElasticsearchIndex();
    if (sharedIndex && where.tenant) {
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
            "locale.keyword": where.locale as string
        }
    });
    delete where.locale;
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
    where: FormBuilderStorageOperationsListFormsParams["where"];
    limit: number;
    after?: PrimitiveValue[];
    sort: string[];
}

export const createElasticsearchBody = (params: CreateElasticsearchBodyParams): esSearchBody => {
    const { plugins, where, limit: initialLimit, sort: initialSort, after } = params;

    const fieldPlugins = plugins
        .byType<FormElasticsearchFieldPlugin>(FormElasticsearchFieldPlugin.type)
        .reduce((acc, plugin) => {
            acc[plugin.field] = plugin;
            return acc;
        }, {} as Record<string, FormElasticsearchFieldPlugin>);

    const limit = createLimit(initialLimit, 100);

    const query = createElasticsearchQuery({
        ...params,
        fieldPlugins
    });

    const sort = createSort({
        sort: initialSort,
        fieldPlugins
    });

    const queryModifiers = plugins.byType<FormElasticsearchQueryModifierPlugin>(
        FormElasticsearchQueryModifierPlugin.type
    );

    for (const plugin of queryModifiers) {
        plugin.modifyQuery({
            query,
            where
        });
    }

    const sortModifiers = plugins.byType<FormElasticsearchSortModifierPlugin>(
        FormElasticsearchSortModifierPlugin.type
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
        search_after: after,
        sort
    };

    const bodyModifiers = plugins.byType<FormElasticsearchBodyModifierPlugin>(
        FormElasticsearchBodyModifierPlugin.type
    );

    for (const plugin of bodyModifiers) {
        plugin.modifyBody({
            body
        });
    }

    return body;
};
